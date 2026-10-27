import { describe, it, expect } from 'vitest'
import { createRefetchMaxAgeTracker, retainStricterMaxAge, type MaxAgeOptions } from '../../src/client/client/maxAge'

describe('retainStricterMaxAge', () => {
  it('keeps the stricter max-age and resolves bustCache to 0', () => {
    expect(retainStricterMaxAge({ maxAgeSeconds: 30 }, { maxAgeSeconds: 10 })).toEqual({ maxAgeSeconds: 10 })
    expect(retainStricterMaxAge({ maxAgeSeconds: 10 }, { maxAgeSeconds: 30 })).toEqual({ maxAgeSeconds: 10 })
    expect(retainStricterMaxAge({ maxAgeSeconds: 30 }, { bustCache: true })).toEqual({ maxAgeSeconds: 0 })
    expect(retainStricterMaxAge(undefined, { maxAgeSeconds: 5 })).toEqual({ maxAgeSeconds: 5 })
    expect(retainStricterMaxAge(undefined, undefined)).toBeUndefined()
  })

  it('returns the current options when the incoming max-age is no stricter', () => {
    const current = { maxAgeSeconds: 10 }
    expect(retainStricterMaxAge(current, { maxAgeSeconds: 30 })).toBe(current)
    expect(retainStricterMaxAge(current, undefined)).toBe(current)
  })
})

describe('createRefetchMaxAgeTracker', () => {
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

  it('fetches with no options until a max-age is recorded', async () => {
    const tracker = createRefetchMaxAgeTracker()
    const { calls, ok } = recorder()
    await tracker.runFetch(ok)
    expect(calls).toEqual([undefined])
    expect(tracker.hasPendingMaxAge()).toBe(false)
  })

  it('sends the stricter of two max-ages', async () => {
    const tracker = createRefetchMaxAgeTracker()
    const { calls, ok } = recorder()
    tracker.recordMaxAge({ maxAgeSeconds: 30 })
    tracker.recordMaxAge({ maxAgeSeconds: 10 })
    tracker.recordMaxAge({ maxAgeSeconds: 60 })
    await tracker.runFetch(ok)
    expect(calls).toEqual([{ maxAgeSeconds: 10 }])
  })

  it('clears the max-age once a fetch with it succeeds', async () => {
    const tracker = createRefetchMaxAgeTracker()
    const { calls, ok } = recorder()
    tracker.recordMaxAge({ bustCache: true })
    await tracker.runFetch(ok)
    await tracker.runFetch(ok)
    expect(calls).toEqual([{ maxAgeSeconds: 0 }, undefined])
    expect(tracker.hasPendingMaxAge()).toBe(false)
  })

  it('keeps the max-age for a retry when a fetch fails', async () => {
    const tracker = createRefetchMaxAgeTracker()
    const { calls, ok, fail } = recorder()
    tracker.recordMaxAge({ maxAgeSeconds: 15 })
    await expect(tracker.runFetch(fail)).rejects.toThrow('unavailable')
    expect(tracker.hasPendingMaxAge()).toBe(true)
    await tracker.runFetch(ok)
    expect(calls).toEqual([{ maxAgeSeconds: 15 }, { maxAgeSeconds: 15 }])
    expect(tracker.hasPendingMaxAge()).toBe(false)
  })

  it('keeps a stricter max-age recorded while a fetch is in flight', async () => {
    const tracker = createRefetchMaxAgeTracker()
    const { calls, ok } = recorder()
    let finish: (value: string) => void = () => {}
    tracker.recordMaxAge({ maxAgeSeconds: 30 })
    const inFlight = tracker.runFetch((options) => {
      calls.push(options)
      return new Promise<string>((resolve) => { finish = resolve })
    })
    tracker.recordMaxAge({ maxAgeSeconds: 5 })
    finish('rows')
    await inFlight
    expect(tracker.hasPendingMaxAge()).toBe(true)
    await tracker.runFetch(ok)
    expect(calls).toEqual([{ maxAgeSeconds: 30 }, { maxAgeSeconds: 5 }])
  })
})
