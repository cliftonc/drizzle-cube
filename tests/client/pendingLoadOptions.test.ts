import { describe, it, expect } from 'vitest'
import { createPendingLoadOptions, mergeLoadOptions, type MaxAgeOptions } from '../../src/client/client/maxAge'

describe('mergeLoadOptions', () => {
  it('keeps the stricter max-age and resolves bustCache to 0', () => {
    expect(mergeLoadOptions({ maxAgeSeconds: 30 }, { maxAgeSeconds: 10 })).toEqual({ maxAgeSeconds: 10 })
    expect(mergeLoadOptions({ maxAgeSeconds: 10 }, { maxAgeSeconds: 30 })).toEqual({ maxAgeSeconds: 10 })
    expect(mergeLoadOptions({ maxAgeSeconds: 30 }, { bustCache: true })).toEqual({ maxAgeSeconds: 0 })
    expect(mergeLoadOptions(undefined, { maxAgeSeconds: 5 })).toEqual({ maxAgeSeconds: 5 })
    expect(mergeLoadOptions(undefined, undefined)).toBeUndefined()
  })

  it('returns the current options when the request is no stricter', () => {
    const current = { maxAgeSeconds: 10 }
    expect(mergeLoadOptions(current, { maxAgeSeconds: 30 })).toBe(current)
    expect(mergeLoadOptions(current, undefined)).toBe(current)
  })
})

describe('createPendingLoadOptions', () => {
  function recorder() {
    const calls: Array<MaxAgeOptions | undefined> = []
    const ok = (options?: MaxAgeOptions) => {
      calls.push(options)
      return Promise.resolve('rows')
    }
    const fail = (options?: MaxAgeOptions) => {
      calls.push(options)
      return Promise.reject(new Error('unavailable'))
    }
    return { calls, ok, fail }
  }

  it('loads with no options until a request is made', async () => {
    const pending = createPendingLoadOptions()
    const { calls, ok } = recorder()
    await pending.load(ok)
    expect(calls).toEqual([undefined])
    expect(pending.hasRequest()).toBe(false)
  })

  it('sends the stricter of two requests', async () => {
    const pending = createPendingLoadOptions()
    const { calls, ok } = recorder()
    pending.request({ maxAgeSeconds: 30 })
    pending.request({ maxAgeSeconds: 10 })
    pending.request({ maxAgeSeconds: 60 })
    await pending.load(ok)
    expect(calls).toEqual([{ maxAgeSeconds: 10 }])
  })

  it('clears the request once a fetch with it succeeds', async () => {
    const pending = createPendingLoadOptions()
    const { calls, ok } = recorder()
    pending.request({ bustCache: true })
    await pending.load(ok)
    await pending.load(ok)
    expect(calls).toEqual([{ maxAgeSeconds: 0 }, undefined])
    expect(pending.hasRequest()).toBe(false)
  })

  it('keeps the request for a retry when a fetch fails', async () => {
    const pending = createPendingLoadOptions()
    const { calls, ok, fail } = recorder()
    pending.request({ maxAgeSeconds: 15 })
    await expect(pending.load(fail)).rejects.toThrow('unavailable')
    expect(pending.hasRequest()).toBe(true)
    await pending.load(ok)
    expect(calls).toEqual([{ maxAgeSeconds: 15 }, { maxAgeSeconds: 15 }])
    expect(pending.hasRequest()).toBe(false)
  })

  it('keeps a stricter request made while a fetch is in flight', async () => {
    const pending = createPendingLoadOptions()
    const { calls, ok } = recorder()
    let finish: (value: string) => void = () => {}
    pending.request({ maxAgeSeconds: 30 })
    const inFlight = pending.load((options) => {
      calls.push(options)
      return new Promise<string>((resolve) => { finish = resolve })
    })
    pending.request({ maxAgeSeconds: 5 })
    finish('rows')
    await inFlight
    expect(pending.hasRequest()).toBe(true)
    await pending.load(ok)
    expect(calls).toEqual([{ maxAgeSeconds: 30 }, { maxAgeSeconds: 5 }])
  })
})
