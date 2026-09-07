/**
 * Chart Configuration Schema — shared by the MCP and Agent tools
 *
 * The chart-side sibling of `QUERY_PARAMS_SCHEMA`. Used by BOTH:
 * - MCP `chart` tool (adapters/mcp-transport.ts)
 * - Agent `add_portlet` / `save_as_dashboard` tools (server/agent/tools.ts)
 *
 * Most charts need nothing here — their axes are inferred from the query. The
 * records table is the exception: it lays out `columns` rather than axes, and a
 * column renders as plain text unless the caller says what it is. Formats are
 * never guessed from the data, so a model that cannot see this shape produces a
 * listing of unformatted strings.
 */
/**
 * `chartConfig` fields for the charts whose mandatory drop zones are not the
 * usual axes. Without these the model cannot state them at all: `heatmap` needs
 * a `valueField` to colour its cells, and `activityGrid` lays itself out from a
 * date field plus a value field. Both were only ever filled by inference.
 */
export declare const FIELD_ZONE_CHART_CONFIG_SCHEMA: {
    readonly valueField: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
        readonly description: "heatmap and activityGrid: single measure driving cell colour intensity. Required for both — the chart renders empty without it.";
    };
    readonly dateField: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
        readonly description: "activityGrid only: single time dimension laying out the grid. Query it with day granularity over several months, or the grid has nothing to show.";
    };
};
/** `displayConfig` fields for charts that need an explicit scale or template. */
export declare const SCALE_DISPLAY_CONFIG_SCHEMA: {
    readonly minValue: {
        readonly type: "number";
        readonly description: "gauge only: scale minimum (defaults to 0).";
    };
    readonly maxValue: {
        readonly type: "number";
        readonly description: "gauge only: scale maximum. ALWAYS set this — without it the gauge scales to the data it was given, so a single value always reads as 100%.";
    };
    readonly template: {
        readonly type: "string";
        readonly description: "kpiText only: sentence template around the value, e.g. \"${fieldLabel}: ${value}\". Defaults to that if omitted.";
    };
};
/** `chartConfig` fields specific to the records table. */
export declare const RECORDS_TABLE_CHART_CONFIG_SCHEMA: {
    readonly columns: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
        readonly description: "recordsTable only: fields to render as columns, in this order. Omit to show every field the query returns, in query order.";
    };
    readonly hiddenColumns: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
        readonly description: "recordsTable only: fields fetched for row context or rowLink tokens but never displayed (e.g. an id used in the URL template). Leave empty unless a field is genuinely only needed behind the scenes — anything listed here disappears from the table.";
    };
};
/** `displayConfig` fields specific to the records table. */
export declare const RECORDS_TABLE_DISPLAY_CONFIG_SCHEMA: {
    readonly columnFormats: {
        readonly type: "object";
        readonly description: "recordsTable only: how each column renders, keyed by field name (e.g. \"Employees.salary\"). Formats are never inferred from the data — a column is plain text unless you say otherwise, so set this for any numeric, date, status or ratio column.";
        readonly additionalProperties: {
            readonly type: "object";
            readonly required: readonly ["kind"];
            readonly properties: {
                readonly kind: {
                    readonly type: "string";
                    readonly enum: readonly ["text", "number", "date", "badge", "progress"];
                    readonly description: "Required on every entry. text: as-is. number: formatted numeric. date: formatted date. badge: coloured pill for statuses/categories. progress: bar or ring for a bounded value. Use \"text\" when you only want to set a label.";
                };
                readonly numberFormat: {
                    readonly type: "object";
                    readonly description: "kind \"number\": { unit: \"currency\"|\"percent\"|\"number\"|\"custom\", decimals, abbreviate (K/M/B), currencyCode, customPrefix, customSuffix }.";
                };
                readonly dateGranularity: {
                    readonly type: "string";
                    readonly description: "kind \"date\": granularity to render at (e.g. \"day\", \"month\", \"year\").";
                };
                readonly badgeColors: {
                    readonly type: "array";
                    readonly description: "kind \"badge\": an ARRAY of { value, colorIndex } entries, not an object keyed by value. colorIndex is a number index into the dashboard palette (0, 1, 2, …), never a colour name like \"green\" — the palette is themed, so names would not follow it. A value with no entry renders neutral rather than being assigned a guessed colour.";
                    readonly items: {
                        readonly type: "object";
                        readonly required: readonly ["value", "colorIndex"];
                        readonly properties: {
                            readonly value: {
                                readonly type: "string";
                                readonly description: "Cell value to colour, matched exactly";
                            };
                            readonly colorIndex: {
                                readonly type: "number";
                                readonly description: "Index into the dashboard colour palette";
                            };
                        };
                    };
                };
                readonly progressMin: {
                    readonly type: "number";
                    readonly description: "kind \"progress\": lower bound (default 0). Values are clamped.";
                };
                readonly progressMax: {
                    readonly type: "number";
                    readonly description: "kind \"progress\": upper bound (default 100). Values are clamped.";
                };
                readonly progressStyle: {
                    readonly type: "string";
                    readonly enum: readonly ["bar", "circle"];
                    readonly description: "kind \"progress\": full-width bar, or a compact ring for narrow columns.";
                };
                readonly label: {
                    readonly type: "string";
                    readonly description: "Header override; defaults to the field title from the cube metadata.";
                };
                readonly align: {
                    readonly type: "string";
                    readonly enum: readonly ["left", "right"];
                    readonly description: "Cell alignment. Numbers usually read better right-aligned.";
                };
            };
        };
    };
    readonly rowLink: {
        readonly type: "object";
        readonly description: "recordsTable only: makes each row a link.";
        readonly required: readonly ["urlTemplate"];
        readonly properties: {
            readonly urlTemplate: {
                readonly type: "string";
                readonly description: "URL with {Cube.field} tokens substituted from the row, including hidden columns (e.g. \"/employees/{Employees.id}\"). Relative paths and http(s) URLs only.";
            };
            readonly target: {
                readonly type: "string";
                readonly enum: readonly ["self", "blank"];
                readonly description: "Open in the same tab (default) or a new one.";
            };
        };
    };
    readonly pageSize: {
        readonly type: "number";
        readonly enum: readonly [25, 50, 100];
        readonly description: "recordsTable only: rows per page (default 25).";
    };
};
