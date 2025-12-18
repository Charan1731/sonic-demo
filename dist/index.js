"use strict";
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  SonicWidget: () => SonicWidget,
  initSonicWidget: () => initSonicWidget
});
module.exports = __toCommonJS(index_exports);

// src/SonicWidget.tsx
var import_react = require("react");

// src/sonicClient.ts
function resolveBaseUrl(config) {
  var _a;
  if (config.baseUrl) return config.baseUrl;
  const env = (_a = config.env) != null ? _a : "development";
  switch (env) {
    case "production":
      return "https://api.sonicbilling.com";
    case "staging":
      return "https://staging-api.sonicbilling.com";
    case "development":
    default:
      return "http://localhost:8000";
  }
}
function buildHeaders(config, userEmail) {
  const headers = {
    "Content-Type": "application/json",
    "X-User-Email": userEmail
  };
  if (config.apiKey) {
    headers["X-Sonic-Api-Key"] = config.apiKey;
  }
  return headers;
}
async function handleResponse(res) {
  const text = await res.text().catch(() => "");
  if (res.ok) {
    return text;
  }
  let errorMessage = text || `Request failed (status ${res.status})`;
  try {
    const errorJson = JSON.parse(text);
    errorMessage = errorJson.detail || errorMessage;
  } catch (e) {
  }
  throw new Error(errorMessage);
}
async function validateConnection(config, userEmail) {
  if (!config.apiKey) {
    throw new Error("Sonic API key is required to initialize the widget.");
  }
  const baseUrl = resolveBaseUrl(config);
  const res = await fetch(`${baseUrl}/api/integrations/api-keys/validate`, {
    headers: {
      "X-Sonic-Api-Key": config.apiKey,
      "X-User-Email": userEmail
    }
  });
  const text = await handleResponse(res);
  return text ? JSON.parse(text) : null;
}
async function fetchSeatMeters(config, userEmail) {
  const baseUrl = resolveBaseUrl(config);
  const res = await fetch(
    `${baseUrl}/api/integrations/api-keys/seat/seat-meters?page_size=100`,
    {
      headers: buildHeaders(config, userEmail)
    }
  );
  const text = await handleResponse(res);
  const data = text ? JSON.parse(text) : null;
  if (Array.isArray(data == null ? void 0 : data.meters)) {
    return data.meters;
  }
  return [];
}
async function createSeatEvent(config, payload, userEmail) {
  const baseUrl = resolveBaseUrl(config);
  const res = await fetch(
    `${baseUrl}/api/integrations/api-keys/seat/seat-events`,
    {
      method: "POST",
      headers: buildHeaders(config, userEmail),
      body: JSON.stringify(payload)
    }
  );
  const text = await handleResponse(res);
  return text ? JSON.parse(text) : {};
}
async function fetchSeatEvents(config, userEmail) {
  const baseUrl = resolveBaseUrl(config);
  const res = await fetch(
    `${baseUrl}/api/integrations/api-keys/seat/seat-events?page_size=100`,
    {
      headers: buildHeaders(config, userEmail)
    }
  );
  const text = await handleResponse(res);
  const data = text ? JSON.parse(text) : null;
  const list = (data == null ? void 0 : data.events) || [];
  return Array.isArray(list) ? list : [];
}
async function fetchCustomerSchedules(config, customerId, userEmail) {
  const baseUrl = resolveBaseUrl(config);
  const res = await fetch(
    `${baseUrl}/api/integrations/api-keys/customers/${customerId}/schedules`,
    {
      headers: buildHeaders(config, userEmail)
    }
  );
  const text = await handleResponse(res);
  const data = text ? JSON.parse(text) : [];
  return Array.isArray(data) ? data : [];
}
async function fetchDashboardStats(config, connection, userEmail) {
  let totalSchedules = 0;
  let activeSchedules = 0;
  let totalInvoices = 0;
  let paidInvoices = 0;
  const baseUrl = resolveBaseUrl(config);
  for (const customer of connection.customers) {
    try {
      const schedulesRes = await fetch(
        `${baseUrl}/api/integrations/api-keys/customers/${customer.id}/schedules`,
        {
          headers: buildHeaders(config, userEmail)
        }
      );
      if (!schedulesRes.ok) continue;
      const schedules = await schedulesRes.json();
      totalSchedules += schedules.length;
      activeSchedules += schedules.filter(
        (s) => s.status === "active"
      ).length;
      for (const schedule of schedules) {
        try {
          const invoicesRes = await fetch(
            `${baseUrl}/api/integrations/api-keys/schedules/${schedule.schedule_id}/invoices`,
            {
              headers: buildHeaders(config, userEmail)
            }
          );
          if (!invoicesRes.ok) continue;
          const invoices = await invoicesRes.json();
          totalInvoices += invoices.length;
          paidInvoices += invoices.filter((inv) => inv.is_paid).length;
        } catch (e) {
        }
      }
    } catch (e) {
    }
  }
  return {
    totalSchedules,
    activeSchedules,
    totalInvoices,
    paidInvoices
  };
}
async function fetchSeatInvoiceForEvent(config, customerId, seatTypeId, eventTimestamp, userEmail) {
  const baseUrl = resolveBaseUrl(config);
  const params = new URLSearchParams({
    customer_id: customerId,
    seat_type_id: seatTypeId
  });
  if (eventTimestamp) {
    params.append("event_timestamp", eventTimestamp);
  }
  const res = await fetch(
    `${baseUrl}/api/integrations/api-keys/seat/seat-events/invoices/by-customer-seat-type?${params.toString()}`,
    {
      headers: buildHeaders(config, userEmail)
    }
  );
  const text = await res.text().catch(() => "");
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    let errorMessage = text || `Failed to load invoice for seat event (status ${res.status})`;
    try {
      const errorJson = JSON.parse(text);
      errorMessage = errorJson.detail || errorMessage;
    } catch (e) {
    }
    throw new Error(errorMessage);
  }
  try {
    return text ? JSON.parse(text) : null;
  } catch (e) {
    return null;
  }
}

// src/SonicWidget.tsx
var import_jsx_runtime = require("react/jsx-runtime");
function DashboardPane({ stats, connection }) {
  const cards = [
    {
      title: "Organization",
      value: connection.organization_name,
      icon: "\u{1F3E2}"
    },
    {
      title: "Total Customers",
      value: connection.total_customers.toString(),
      icon: "\u{1F465}"
    },
    {
      title: "Total Schedules",
      value: stats.totalSchedules.toString(),
      icon: "\u{1F4C5}"
    },
    {
      title: "Active Schedules",
      value: stats.activeSchedules.toString(),
      icon: "\u2705"
    },
    {
      title: "Total Invoices",
      value: stats.totalInvoices.toString(),
      icon: "\u{1F4C4}"
    },
    {
      title: "Paid Invoices",
      value: stats.paidInvoices.toString(),
      icon: "\u{1F4B0}"
    }
  ];
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem"
      },
      children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "div",
        {
          style: {
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "0.9rem"
          },
          children: cards.map((card) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "div",
            {
              style: {
                backgroundColor: "#ffffff",
                borderRadius: "0.9rem",
                border: "1px solid #e5e7eb",
                padding: "1.1rem 1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem"
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "div",
                  {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between"
                    },
                    children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "1.6rem" }, children: card.icon })
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "div",
                  {
                    style: {
                      fontSize: "1.6rem",
                      fontWeight: 700
                    },
                    children: card.value
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "div",
                  {
                    style: {
                      fontSize: "0.85rem",
                      color: "#6b7280"
                    },
                    children: card.title
                  }
                )
              ]
            },
            card.title
          ))
        }
      )
    }
  );
}
function CustomersPane({
  connection,
  theme,
  onSelectCustomer
}) {
  var _a, _b;
  const [searchQuery, setSearchQuery] = (0, import_react.useState)("");
  const filteredCustomers = (_a = connection.customers.filter(
    (customer) => {
      var _a2;
      return customer.name.toLowerCase().includes(searchQuery.toLowerCase()) || ((_a2 = customer.email) == null ? void 0 : _a2.toLowerCase().includes(searchQuery.toLowerCase()));
    }
  )) != null ? _a : [];
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem"
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.75rem",
              flexWrap: "wrap"
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "h2",
                  {
                    style: {
                      fontSize: "1.25rem",
                      fontWeight: 600
                    },
                    children: "Customers"
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "p",
                  {
                    style: {
                      fontSize: "0.9rem",
                      opacity: 0.8
                    },
                    children: "Browse and drill into your Sonic customers."
                  }
                )
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                "div",
                {
                  style: {
                    padding: "0.45rem 0.9rem",
                    borderRadius: "999px",
                    border: "1px solid #e5e7eb",
                    fontSize: "0.8rem"
                  },
                  children: [
                    connection.total_customers,
                    " customers"
                  ]
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            type: "text",
            placeholder: "Search customers by name or email...",
            value: searchQuery,
            onChange: (e) => setSearchQuery(e.target.value),
            style: {
              width: "100%",
              padding: "0.65rem 0.9rem",
              borderRadius: "0.6rem",
              border: `1px solid ${(_b = theme.borderColor) != null ? _b : "#000000"}`,
              fontSize: "0.9rem"
            }
          }
        ) }),
        filteredCustomers.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "div",
          {
            style: {
              padding: "2.5rem",
              textAlign: "center",
              borderRadius: "0.9rem",
              border: "1px solid #e5e7eb",
              backgroundColor: "#ffffff",
              fontSize: "0.9rem"
            },
            children: searchQuery ? "No customers found matching your search." : "No customers found."
          }
        ) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "div",
          {
            style: {
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "0.9rem"
            },
            children: filteredCustomers.map((customer) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
              "button",
              {
                type: "button",
                onClick: () => onSelectCustomer(customer.id),
                style: {
                  textAlign: "left",
                  backgroundColor: "#ffffff",
                  borderRadius: "0.9rem",
                  border: "1px solid #e5e7eb",
                  padding: "1.1rem 1rem",
                  cursor: "pointer"
                },
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                    "div",
                    {
                      style: {
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        marginBottom: "0.7rem"
                      },
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                          "div",
                          {
                            style: {
                              width: "40px",
                              height: "40px",
                              borderRadius: "0.75rem",
                              backgroundColor: "#000000",
                              color: "#ffffff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 600,
                              fontSize: "1.1rem"
                            },
                            children: customer.name.charAt(0).toUpperCase()
                          }
                        ),
                        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
                          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                            "div",
                            {
                              style: {
                                fontSize: "0.95rem",
                                fontWeight: 600
                              },
                              children: customer.name
                            }
                          ),
                          customer.email && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                            "div",
                            {
                              style: {
                                fontSize: "0.8rem",
                                opacity: 0.8
                              },
                              children: customer.email
                            }
                          )
                        ] })
                      ]
                    }
                  ),
                  customer.phone && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                    "div",
                    {
                      style: {
                        fontSize: "0.8rem",
                        opacity: 0.8
                      },
                      children: [
                        "\u{1F4DE} ",
                        customer.phone
                      ]
                    }
                  )
                ]
              },
              customer.id
            ))
          }
        )
      ]
    }
  );
}
function CustomerDetailPane({
  customer,
  schedules,
  loading,
  error,
  onBack
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem"
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            type: "button",
            onClick: onBack,
            style: {
              alignSelf: "flex-start",
              border: "none",
              background: "transparent",
              padding: 0,
              fontSize: "0.85rem",
              color: "#6b7280",
              cursor: "pointer"
            },
            children: "\u2190 Back to customers"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "div",
          {
            style: {
              backgroundColor: "#ffffff",
              borderRadius: "0.9rem",
              border: "1px solid #e5e7eb",
              padding: "1.4rem 1.3rem",
              display: "flex",
              alignItems: "center",
              gap: "1rem"
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "div",
                {
                  style: {
                    width: "56px",
                    height: "56px",
                    borderRadius: "1rem",
                    backgroundColor: "#000000",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "1.5rem"
                  },
                  children: customer.name.charAt(0).toUpperCase()
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "div",
                  {
                    style: {
                      fontSize: "1.25rem",
                      fontWeight: 600
                    },
                    children: customer.name
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                  "div",
                  {
                    style: {
                      marginTop: "0.35rem",
                      fontSize: "0.86rem",
                      color: "#6b7280",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.2rem"
                    },
                    children: [
                      customer.email && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
                        "\u{1F4E7} ",
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: customer.email })
                      ] }),
                      customer.phone && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
                        "\u{1F4DE} ",
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: customer.phone })
                      ] })
                    ]
                  }
                )
              ] })
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "div",
          {
            style: {
              backgroundColor: "#ffffff",
              borderRadius: "0.9rem",
              border: "1px solid #e5e7eb",
              padding: "1.4rem 1.3rem"
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "div",
                {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "1rem"
                  },
                  children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                    "h2",
                    {
                      style: {
                        fontSize: "1.1rem",
                        fontWeight: 600
                      },
                      children: [
                        "Schedules (",
                        schedules.length,
                        ")"
                      ]
                    }
                  )
                }
              ),
              error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "div",
                {
                  style: {
                    marginBottom: "0.85rem",
                    padding: "0.75rem 0.85rem",
                    borderRadius: "0.75rem",
                    border: "1px solid #fecaca",
                    backgroundColor: "#fef2f2",
                    color: "#b91c1c",
                    fontSize: "0.85rem"
                  },
                  children: error
                }
              ),
              loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "div",
                {
                  style: {
                    padding: "2rem",
                    textAlign: "center",
                    color: "#6b7280",
                    fontSize: "0.9rem"
                  },
                  children: "Loading schedules\u2026"
                }
              ) : schedules.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "div",
                {
                  style: {
                    padding: "2rem",
                    textAlign: "center",
                    color: "#6b7280",
                    fontSize: "0.9rem"
                  },
                  children: "No schedules found for this customer."
                }
              ) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "div",
                {
                  style: {
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                    gap: "0.85rem"
                  },
                  children: schedules.map((schedule) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                    "div",
                    {
                      style: {
                        padding: "1rem",
                        borderRadius: "0.8rem",
                        border: "1px solid #e5e7eb",
                        backgroundColor: "#f9fafb"
                      },
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                          "div",
                          {
                            style: {
                              display: "flex",
                              alignItems: "flex-start",
                              justifyContent: "space-between",
                              marginBottom: "0.5rem"
                            },
                            children: [
                              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                                "div",
                                {
                                  style: {
                                    fontSize: "0.96rem",
                                    fontWeight: 600
                                  },
                                  children: schedule.billing_schedule_label || schedule.contract_name || "Unnamed Schedule"
                                }
                              ),
                              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                                "span",
                                {
                                  style: {
                                    display: "inline-block",
                                    padding: "0.15rem 0.45rem",
                                    borderRadius: "999px",
                                    fontSize: "0.72rem",
                                    fontWeight: 500,
                                    backgroundColor: schedule.status === "active" ? "#d1fae5" : schedule.status === "draft" ? "#fef3c7" : "#e5e7eb",
                                    color: schedule.status === "active" ? "#065f46" : schedule.status === "draft" ? "#92400e" : "#6b7280"
                                  },
                                  children: schedule.status || "draft"
                                }
                              )
                            ]
                          }
                        ),
                        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                          "div",
                          {
                            style: {
                              fontSize: "0.8rem",
                              color: "#6b7280"
                            },
                            children: [
                              schedule.start_date && new Date(schedule.start_date).toLocaleDateString(),
                              schedule.end_date && ` - ${new Date(schedule.end_date).toLocaleDateString()}`
                            ]
                          }
                        )
                      ]
                    },
                    schedule.schedule_id
                  ))
                }
              )
            ]
          }
        )
      ]
    }
  );
}
function SonicWidget(props) {
  var _a, _b;
  const {
    apiKey,
    user,
    env,
    baseUrl,
    theme,
    buttonLabel = "Manage Seats",
    onOpen,
    onClose,
    onError
  } = props;
  const [open, setOpen] = (0, import_react.useState)(false);
  const clientConfig = (0, import_react.useMemo)(
    () => ({
      apiKey,
      env,
      baseUrl
    }),
    [apiKey, env, baseUrl]
  );
  const handleOpen = (0, import_react.useCallback)(() => {
    setOpen(true);
    if (onOpen) onOpen();
  }, [onOpen]);
  const handleClose = (0, import_react.useCallback)(() => {
    setOpen(false);
    if (onClose) onClose();
  }, [onClose]);
  const resolvedTheme = (0, import_react.useMemo)(() => {
    var _a2, _b2, _c, _d, _e, _f, _g;
    const mode = (_a2 = theme == null ? void 0 : theme.mode) != null ? _a2 : "light";
    if (mode === "dark") {
      return {
        mode,
        primaryColor: (_b2 = theme == null ? void 0 : theme.primaryColor) != null ? _b2 : "#ffffff",
        borderColor: (_c = theme == null ? void 0 : theme.borderColor) != null ? _c : "#4b5563",
        backgroundColor: (_d = theme == null ? void 0 : theme.backgroundColor) != null ? _d : "#000000"
      };
    }
    return {
      mode,
      primaryColor: (_e = theme == null ? void 0 : theme.primaryColor) != null ? _e : "#000000",
      borderColor: (_f = theme == null ? void 0 : theme.borderColor) != null ? _f : "#000000",
      backgroundColor: (_g = theme == null ? void 0 : theme.backgroundColor) != null ? _g : "#ffffff"
    };
  }, [theme]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "button",
      {
        type: "button",
        onClick: handleOpen,
        style: {
          padding: "0.5rem 1.25rem",
          borderRadius: "999px",
          border: `1px solid ${(_a = resolvedTheme.borderColor) != null ? _a : "#000000"}`,
          backgroundColor: (_b = resolvedTheme.primaryColor) != null ? _b : "#000000",
          color: resolvedTheme.mode === "dark" ? "#000000" : "#ffffff",
          fontSize: "0.9rem",
          fontWeight: 600,
          cursor: "pointer"
        },
        children: buttonLabel
      }
    ),
    open && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SonicModal, { onClose: handleClose, theme: resolvedTheme, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      SonicWorkspaceWidget,
      {
        clientConfig,
        userEmail: user.email,
        theme: resolvedTheme,
        onError
      }
    ) })
  ] });
}
function SonicModal({ children, onClose, theme }) {
  var _a, _b, _c, _d;
  (0, import_react.useEffect)(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "div",
    {
      style: {
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.4)"
      },
      onClick: onClose,
      children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "div",
        {
          style: {
            maxWidth: "960px",
            width: "100%",
            maxHeight: "90vh",
            margin: "1.5rem",
            backgroundColor: (_a = theme.backgroundColor) != null ? _a : "#ffffff",
            color: theme.mode === "dark" ? "#ffffff" : "#000000",
            borderRadius: "1rem",
            border: `1px solid ${(_b = theme.borderColor) != null ? _b : "#000000"}`,
            boxShadow: "0 20px 45px rgba(15,23,42,0.35)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column"
          },
          onClick: (e) => e.stopPropagation(),
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
              "div",
              {
                style: {
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.9rem 1.3rem",
                  borderBottom: `1px solid ${(_c = theme.borderColor) != null ? _c : "#000000"}`
                },
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                    "div",
                    {
                      style: {
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.15rem"
                      },
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                          "span",
                          {
                            style: {
                              fontSize: "0.95rem",
                              fontWeight: 600
                            },
                            children: "Sonic Seat Events"
                          }
                        ),
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                          "span",
                          {
                            style: {
                              fontSize: "0.8rem",
                              opacity: 0.75
                            },
                            children: "Adjust seats for your customers and review recent changes"
                          }
                        )
                      ]
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    "button",
                    {
                      type: "button",
                      onClick: onClose,
                      "aria-label": "Close",
                      style: {
                        width: "28px",
                        height: "28px",
                        borderRadius: "999px",
                        border: `1px solid ${(_d = theme.borderColor) != null ? _d : "#000000"}`,
                        backgroundColor: "transparent",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1rem",
                        lineHeight: 1
                      },
                      children: "\xD7"
                    }
                  )
                ]
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "div",
              {
                style: {
                  padding: "1.25rem 1.5rem 1.5rem",
                  overflow: "auto"
                },
                children
              }
            )
          ]
        }
      )
    }
  );
}
function SonicWorkspaceWidget({
  clientConfig,
  userEmail,
  theme,
  onError
}) {
  var _a, _b;
  const [connection, setConnection] = (0, import_react.useState)(null);
  const [stats, setStats] = (0, import_react.useState)({
    totalSchedules: 0,
    activeSchedules: 0,
    totalInvoices: 0,
    paidInvoices: 0
  });
  const [loading, setLoading] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)(null);
  const [activeView, setActiveView] = (0, import_react.useState)("dashboard");
  const [selectedCustomerId, setSelectedCustomerId] = (0, import_react.useState)(
    null
  );
  const [customerSchedules, setCustomerSchedules] = (0, import_react.useState)({});
  const [customerSchedulesLoading, setCustomerSchedulesLoading] = (0, import_react.useState)({});
  const [customerSchedulesError, setCustomerSchedulesError] = (0, import_react.useState)({});
  function emitError(e, fallbackMessage) {
    const message = e instanceof Error ? e.message : fallbackMessage;
    setError(message);
    if (onError) {
      onError(e instanceof Error ? e : new Error(message));
    }
  }
  (0, import_react.useEffect)(() => {
    async function loadWorkspace() {
      setLoading(true);
      setError(null);
      try {
        const conn = await validateConnection(clientConfig, userEmail);
        setConnection(conn);
        const s = await fetchDashboardStats(clientConfig, conn, userEmail);
        setStats(s);
      } catch (e) {
        emitError(e, "Unknown error while connecting to Sonic");
      } finally {
        setLoading(false);
      }
    }
    void loadWorkspace();
  }, [clientConfig, userEmail]);
  async function ensureCustomerSchedules(customerId) {
    if (customerSchedules[customerId]) return;
    setCustomerSchedulesLoading((prev) => __spreadProps(__spreadValues({}, prev), { [customerId]: true }));
    setCustomerSchedulesError((prev) => __spreadProps(__spreadValues({}, prev), { [customerId]: null }));
    try {
      const schedules = await fetchCustomerSchedules(
        clientConfig,
        customerId,
        userEmail
      );
      setCustomerSchedules((prev) => __spreadProps(__spreadValues({}, prev), { [customerId]: schedules }));
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error while loading schedules";
      setCustomerSchedulesError((prev) => __spreadProps(__spreadValues({}, prev), { [customerId]: message }));
      if (onError) {
        onError(e instanceof Error ? e : new Error(message));
      }
    } finally {
      setCustomerSchedulesLoading((prev) => __spreadProps(__spreadValues({}, prev), { [customerId]: false }));
    }
  }
  if (loading && !connection) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "div",
      {
        style: {
          padding: "3rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        },
        children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: "Loading Sonic workspace\u2026" })
      }
    );
  }
  if (!connection) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "div",
      {
        style: {
          padding: "3rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        },
        children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: error || "Unable to load Sonic workspace. Please check your API key and try again." })
      }
    );
  }
  const selectedCustomer = selectedCustomerId ? (_a = connection.customers.find((c) => c.id === selectedCustomerId)) != null ? _a : null : null;
  const selectedCustomerSchedules = selectedCustomerId ? (_b = customerSchedules[selectedCustomerId]) != null ? _b : [] : [];
  const selectedCustomerSchedulesLoading = selectedCustomerId && customerSchedulesLoading[selectedCustomerId] || false;
  const selectedCustomerSchedulesError = selectedCustomerId && customerSchedulesError[selectedCustomerId] || null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: "1rem"
      },
      children: [
        error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "div",
          {
            style: {
              marginBottom: "0.5rem",
              padding: "0.75rem 0.9rem",
              borderRadius: "0.75rem",
              border: "1px solid #f97316",
              backgroundColor: "#fffbeb",
              color: "#7c2d12",
              fontSize: "0.85rem"
            },
            children: error
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.75rem",
              flexWrap: "wrap"
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "div",
                  {
                    style: {
                      fontSize: "0.8rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      opacity: 0.7,
                      marginBottom: "0.25rem"
                    },
                    children: "Sonic organization"
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "div",
                  {
                    style: {
                      fontSize: "1.05rem",
                      fontWeight: 600
                    },
                    children: connection.organization_name
                  }
                )
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                "div",
                {
                  style: {
                    display: "inline-flex",
                    padding: "0.35rem 0.75rem",
                    borderRadius: "999px",
                    border: "1px solid rgba(148,163,184,0.4)",
                    backgroundColor: "rgba(15,23,42,0.02)",
                    fontSize: "0.8rem",
                    alignItems: "center",
                    gap: "0.4rem"
                  },
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                      "span",
                      {
                        style: {
                          width: "8px",
                          height: "8px",
                          borderRadius: "999px",
                          backgroundColor: "#22c55e"
                        }
                      }
                    ),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Connected" }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { opacity: 0.6 }, children: [
                      connection.total_customers,
                      " customers"
                    ] })
                  ]
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "div",
          {
            style: {
              display: "flex",
              gap: "0.5rem",
              borderRadius: "999px",
              padding: "0.15rem",
              backgroundColor: "rgba(15,23,42,0.03)",
              border: "1px solid rgba(148,163,184,0.4)",
              width: "fit-content"
            },
            children: [
              { id: "dashboard", label: "Dashboard" },
              { id: "customers", label: "Customers" },
              { id: "seat-events", label: "Seat Events" }
            ].map((tab) => {
              const active = activeView === tab.id;
              return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "button",
                {
                  type: "button",
                  onClick: () => {
                    setActiveView(tab.id);
                    if (tab.id !== "customer-detail") {
                      setSelectedCustomerId(null);
                    }
                  },
                  style: {
                    border: "none",
                    outline: "none",
                    cursor: "pointer",
                    borderRadius: "999px",
                    padding: "0.35rem 0.9rem",
                    fontSize: "0.85rem",
                    fontWeight: active ? 600 : 500,
                    backgroundColor: active ? "#000000" : "transparent",
                    color: active ? "#ffffff" : "#111827"
                  },
                  children: tab.label
                },
                tab.id
              );
            })
          }
        ),
        activeView === "dashboard" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DashboardPane, { stats, connection }),
        activeView === "customers" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          CustomersPane,
          {
            connection,
            theme,
            onSelectCustomer: async (customerId) => {
              setSelectedCustomerId(customerId);
              setActiveView("customer-detail");
              await ensureCustomerSchedules(customerId);
            }
          }
        ),
        activeView === "customer-detail" && selectedCustomer && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          CustomerDetailPane,
          {
            customer: selectedCustomer,
            schedules: selectedCustomerSchedules,
            loading: selectedCustomerSchedulesLoading,
            error: selectedCustomerSchedulesError,
            onBack: () => {
              setActiveView("customers");
            }
          }
        ),
        activeView === "seat-events" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          SeatEventsWidget,
          {
            connection,
            clientConfig,
            userEmail,
            theme,
            onError
          }
        )
      ]
    }
  );
}
function SeatEventsWidget({
  connection,
  clientConfig,
  userEmail,
  theme,
  onError
}) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s;
  const [loading, setLoading] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)(null);
  const [seatMeters, setSeatMeters] = (0, import_react.useState)([]);
  const [seatMetersError, setSeatMetersError] = (0, import_react.useState)(null);
  const [seatMetersLoading, setSeatMetersLoading] = (0, import_react.useState)(false);
  const [seatCustomerId, setSeatCustomerId] = (0, import_react.useState)("");
  const [seatMeterId, setSeatMeterId] = (0, import_react.useState)("");
  const [seatChange, setSeatChange] = (0, import_react.useState)("");
  const [seatChangeType, setSeatChangeType] = (0, import_react.useState)("add");
  const [seatEventTimestamp, setSeatEventTimestamp] = (0, import_react.useState)("");
  const [seatEventDisplay, setSeatEventDisplay] = (0, import_react.useState)("");
  const [eventPickerOpen, setEventPickerOpen] = (0, import_react.useState)(false);
  const [eventDate, setEventDate] = (0, import_react.useState)(null);
  const [seatEventLoading, setSeatEventLoading] = (0, import_react.useState)(false);
  const [seatEventSuccess, setSeatEventSuccess] = (0, import_react.useState)(null);
  const [seatEventError, setSeatEventError] = (0, import_react.useState)(null);
  const [invoiceInfo, setInvoiceInfo] = (0, import_react.useState)(null);
  const [invoiceLoading, setInvoiceLoading] = (0, import_react.useState)(false);
  const [invoiceError, setInvoiceError] = (0, import_react.useState)(null);
  const [events, setEvents] = (0, import_react.useState)([]);
  const [eventsLoading, setEventsLoading] = (0, import_react.useState)(false);
  const [eventsError, setEventsError] = (0, import_react.useState)(null);
  function ensurePickerStateFromTimestamp() {
    const existing = seatEventTimestamp;
    const base = existing ? new Date(existing) : /* @__PURE__ */ new Date();
    if (Number.isNaN(base.getTime())) {
      return;
    }
    setEventDate(new Date(base.getFullYear(), base.getMonth(), base.getDate()));
  }
  function updateTimestamp(dateOverride) {
    var _a2;
    const date = (_a2 = dateOverride != null ? dateOverride : eventDate) != null ? _a2 : /* @__PURE__ */ new Date();
    if (!date) return;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const localDateTime = `${year}-${month}-${day}T00:00`;
    setEventDate(date);
    setSeatEventTimestamp(localDateTime);
    setSeatEventDisplay(date.toLocaleDateString());
  }
  async function loadInvoice() {
    setInvoiceError(null);
    if (!seatCustomerId || !seatMeterId || !seatEventTimestamp) {
      setInvoiceInfo(null);
      return;
    }
    const meter = seatMeters.find((m) => m.id === seatMeterId);
    const seatTypeId = meter == null ? void 0 : meter.seat_type_id;
    if (!seatTypeId) {
      setInvoiceInfo(null);
      return;
    }
    setInvoiceLoading(true);
    try {
      const info = await fetchSeatInvoiceForEvent(
        clientConfig,
        seatCustomerId,
        seatTypeId,
        seatEventTimestamp,
        userEmail
      );
      setInvoiceInfo(info);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error while loading invoice details";
      setInvoiceError(message);
      setInvoiceInfo(null);
      if (onError) {
        onError(e instanceof Error ? e : new Error(message));
      }
    } finally {
      setInvoiceLoading(false);
    }
  }
  (0, import_react.useEffect)(() => {
    async function loadInitialData() {
      setLoading(true);
      setError(null);
      setSeatMetersLoading(true);
      setSeatMetersError(null);
      try {
        const meters = await fetchSeatMeters(clientConfig, userEmail);
        setSeatMeters(meters);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error while loading seat meters";
        setSeatMetersError(message);
        if (onError) {
          onError(e instanceof Error ? e : new Error(message));
        }
      } finally {
        setSeatMetersLoading(false);
      }
      setEventsLoading(true);
      setEventsError(null);
      try {
        const list = await fetchSeatEvents(clientConfig, userEmail);
        setEvents(list);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error while loading seat events";
        setEventsError(message);
        if (onError) {
          onError(e instanceof Error ? e : new Error(message));
        }
      } finally {
        setEventsLoading(false);
        setLoading(false);
      }
    }
    void loadInitialData();
  }, [clientConfig, userEmail, onError]);
  (0, import_react.useEffect)(() => {
    if (!seatCustomerId || !seatMeterId || !seatEventTimestamp) {
      setInvoiceInfo(null);
      return;
    }
    void loadInvoice();
  }, [seatCustomerId, seatMeterId, seatEventTimestamp, userEmail]);
  async function handleCreateSeatEvent() {
    if (!seatCustomerId) {
      setSeatEventError("Please select a customer.");
      return;
    }
    if (!seatMeterId) {
      setSeatEventError("Please select a seat meter.");
      return;
    }
    const seats = typeof seatChange === "string" ? parseInt(seatChange, 10) : seatChange;
    if (!seats || seats <= 0) {
      setSeatEventError("Please enter a positive number of seats.");
      return;
    }
    setSeatEventLoading(true);
    setSeatEventError(null);
    setSeatEventSuccess(null);
    try {
      const payloadBase = seatChangeType === "add" ? {
        seat_meter_id: seatMeterId,
        customer_id: seatCustomerId,
        event_type: "added",
        seats_added: seats
      } : {
        seat_meter_id: seatMeterId,
        customer_id: seatCustomerId,
        event_type: "removed",
        seats_removed: seats
      };
      const payload = __spreadValues(__spreadValues({}, payloadBase), seatEventTimestamp ? {
        event_timestamp: new Date(seatEventTimestamp).toISOString()
      } : {});
      const res = await createSeatEvent(
        clientConfig,
        payload,
        userEmail
      );
      const balanceAfter = res.balance_after;
      setSeatEventSuccess(
        balanceAfter !== void 0 ? `Seat event created. New balance: ${balanceAfter} seats.` : "Seat event created successfully."
      );
      setSeatChange("");
      setSeatEventTimestamp("");
      setSeatEventDisplay("");
      setEventsLoading(true);
      setEventsError(null);
      try {
        const list = await fetchSeatEvents(clientConfig, userEmail);
        setEvents(list);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error while loading seat events";
        setEventsError(message);
        if (onError) {
          onError(e instanceof Error ? e : new Error(message));
        }
      } finally {
        setEventsLoading(false);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error while creating seat event";
      setSeatEventError(message);
      if (onError) {
        onError(e instanceof Error ? e : new Error(message));
      }
    } finally {
      setSeatEventLoading(false);
    }
  }
  function renderSeatChangePreview() {
    const numericChange = typeof seatChange === "string" ? Number.parseInt(seatChange, 10) : seatChange;
    if (!numericChange || Number.isNaN(numericChange)) {
      return null;
    }
    const signedChange = seatChangeType === "add" ? numericChange : -numericChange;
    const base = invoiceInfo && invoiceInfo.seats_balance != null ? invoiceInfo.seats_balance : null;
    const newTotal = base != null ? base + signedChange : null;
    if (base != null && newTotal != null) {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        "Current seats_balance (from invoice): ",
        base,
        " seats",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
        "Change: ",
        signedChange > 0 ? `+${signedChange}` : signedChange,
        " seats \u2192 New total: ",
        newTotal,
        " seats"
      ] });
    }
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      "Change: ",
      seatChangeType === "add" ? "+" : "-",
      numericChange,
      " seats"
    ] });
  }
  if (loading) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "div",
      {
        style: {
          padding: "3rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        },
        children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: "Loading Sonic seat events\u2026" })
      }
    );
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "div",
    {
      style: {
        padding: "0.25rem",
        backgroundColor: theme.mode === "dark" ? "#000000" : "#f5f5f5",
        color: theme.mode === "dark" ? "#ffffff" : "#000000"
      },
      children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "div",
        {
          style: {
            backgroundColor: (_a = theme.backgroundColor) != null ? _a : "#ffffff",
            borderRadius: "1rem",
            border: `1px solid ${theme.mode === "dark" ? "#4b5563" : "#e5e7eb"}`,
            boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
            padding: "1.5rem 1.3rem 1.5rem"
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
              "div",
              {
                style: {
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "0.75rem",
                  marginBottom: "1.25rem"
                },
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                      "h1",
                      {
                        style: {
                          fontSize: "1.4rem",
                          fontWeight: 700,
                          marginBottom: "0.25rem"
                        },
                        children: "Seat Events"
                      }
                    ),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "0.9rem", opacity: 0.8 }, children: "Quickly adjust seats for a customer and review recent changes." })
                  ] }),
                  connection && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                    "div",
                    {
                      style: {
                        padding: "0.4rem 0.8rem",
                        borderRadius: "999px",
                        border: `1px solid ${theme.mode === "dark" ? "#4b5563" : "#e5e7eb"}`,
                        backgroundColor: theme.mode === "dark" ? "#020617" : "#f9fafb",
                        fontSize: "0.8rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        whiteSpace: "nowrap"
                      },
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                          "span",
                          {
                            style: {
                              display: "inline-block",
                              width: "8px",
                              height: "8px",
                              borderRadius: "999px",
                              backgroundColor: "#22c55e"
                            }
                          }
                        ),
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontWeight: 600 }, children: "Connected" }),
                        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { opacity: 0.6 }, children: [
                          "to ",
                          connection.organization_name
                        ] })
                      ]
                    }
                  )
                ]
              }
            ),
            error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "div",
              {
                style: {
                  marginBottom: "1.05rem",
                  padding: "0.85rem 1rem",
                  borderRadius: "0.75rem",
                  border: "1px solid #f97316",
                  backgroundColor: "#fffbeb",
                  color: "#7c2d12",
                  fontSize: "0.9rem"
                },
                children: error
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
              "div",
              {
                style: {
                  borderRadius: "0.9rem",
                  border: `1px solid ${theme.mode === "dark" ? "#4b5563" : "#e5e7eb"}`,
                  padding: "1.2rem 1.05rem 1.35rem",
                  backgroundColor: (_b = theme.backgroundColor) != null ? _b : "#ffffff",
                  marginBottom: "1.5rem"
                },
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    "h2",
                    {
                      style: {
                        fontSize: "1.02rem",
                        fontWeight: 600,
                        marginBottom: "0.9rem"
                      },
                      children: "Add Seat Event"
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                    "div",
                    {
                      style: {
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: "1rem",
                        marginBottom: "1rem"
                      },
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
                          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                            "label",
                            {
                              style: {
                                display: "block",
                                fontSize: "0.8rem",
                                fontWeight: 500,
                                marginBottom: "0.35rem"
                              },
                              children: "Customer"
                            }
                          ),
                          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                            "select",
                            {
                              value: seatCustomerId,
                              onChange: (e) => setSeatCustomerId(e.target.value),
                              style: {
                                width: "100%",
                                padding: "0.5rem 0.75rem",
                                borderRadius: "0.5rem",
                                border: `1px solid ${(_c = theme.borderColor) != null ? _c : "#000000"}`,
                                backgroundColor: (_d = theme.backgroundColor) != null ? _d : "#ffffff",
                                fontSize: "0.9rem"
                              },
                              children: [
                                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "", children: "Select customer" }),
                                connection == null ? void 0 : connection.customers.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", { value: c.id, children: [
                                  c.name,
                                  " ",
                                  c.email ? `(${c.email})` : ""
                                ] }, c.id))
                              ]
                            }
                          )
                        ] }),
                        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
                          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                            "label",
                            {
                              style: {
                                display: "block",
                                fontSize: "0.8rem",
                                fontWeight: 500,
                                marginBottom: "0.35rem"
                              },
                              children: "Seat Meter"
                            }
                          ),
                          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                            "select",
                            {
                              value: seatMeterId,
                              onChange: (e) => setSeatMeterId(e.target.value),
                              style: {
                                width: "100%",
                                padding: "0.5rem 0.75rem",
                                borderRadius: "0.5rem",
                                border: `1px solid ${(_e = theme.borderColor) != null ? _e : "#000000"}`,
                                backgroundColor: (_f = theme.backgroundColor) != null ? _f : "#ffffff",
                                fontSize: "0.9rem"
                              },
                              children: [
                                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "", children: seatMetersLoading ? "Loading seat meters..." : "Select seat meter" }),
                                seatMeters.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: m.id, children: m.name }, m.id))
                              ]
                            }
                          ),
                          seatMetersError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                            "div",
                            {
                              style: {
                                marginTop: "0.25rem",
                                fontSize: "0.8rem"
                              },
                              children: seatMetersError
                            }
                          )
                        ] }),
                        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
                          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                            "label",
                            {
                              style: {
                                display: "block",
                                fontSize: "0.8rem",
                                fontWeight: 500,
                                marginBottom: "0.35rem"
                              },
                              children: "Event Date (optional)"
                            }
                          ),
                          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                            "div",
                            {
                              style: {
                                position: "relative",
                                width: "100%"
                              },
                              children: [
                                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                                  "input",
                                  {
                                    type: "date",
                                    value: eventDate ? `${eventDate.getFullYear()}-${String(
                                      eventDate.getMonth() + 1
                                    ).padStart(2, "0")}-${String(
                                      eventDate.getDate()
                                    ).padStart(2, "0")}` : "",
                                    onChange: (e) => {
                                      if (!e.target.value) {
                                        setEventDate(null);
                                        setSeatEventTimestamp("");
                                        setSeatEventDisplay("");
                                        return;
                                      }
                                      const [year, month, day] = e.target.value.split("-").map(Number);
                                      const date = new Date(year, month - 1, day);
                                      updateTimestamp(date);
                                    },
                                    onFocus: () => {
                                      if (!eventPickerOpen) {
                                        ensurePickerStateFromTimestamp();
                                        setEventPickerOpen(true);
                                      }
                                    },
                                    onBlur: () => {
                                      setEventPickerOpen(false);
                                    },
                                    placeholder: "Pick a date",
                                    style: {
                                      width: "100%",
                                      padding: "0.5rem 0.75rem",
                                      borderRadius: "0.5rem",
                                      border: `1px solid ${(_g = theme.borderColor) != null ? _g : "#000000"}`,
                                      backgroundColor: (_h = theme.backgroundColor) != null ? _h : "#ffffff",
                                      fontSize: "0.9rem"
                                    }
                                  }
                                ),
                                seatEventDisplay && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                                  "div",
                                  {
                                    style: {
                                      marginTop: "0.2rem",
                                      fontSize: "0.8rem",
                                      opacity: 0.8
                                    },
                                    children: seatEventDisplay
                                  }
                                )
                              ]
                            }
                          )
                        ] }),
                        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
                          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                            "label",
                            {
                              style: {
                                display: "block",
                                fontSize: "0.8rem",
                                fontWeight: 500,
                                marginBottom: "0.35rem"
                              },
                              children: "Seats"
                            }
                          ),
                          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                            "div",
                            {
                              style: {
                                display: "flex",
                                gap: "0.5rem",
                                alignItems: "center"
                              },
                              children: [
                                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                                  "select",
                                  {
                                    value: seatChangeType,
                                    onChange: (e) => setSeatChangeType(e.target.value),
                                    style: {
                                      padding: "0.5rem 0.75rem",
                                      borderRadius: "0.5rem",
                                      border: `1px solid ${(_i = theme.borderColor) != null ? _i : "#000000"}`,
                                      backgroundColor: (_j = theme.backgroundColor) != null ? _j : "#ffffff",
                                      fontSize: "0.9rem"
                                    },
                                    children: [
                                      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "add", children: "Add" }),
                                      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "remove", children: "Remove" })
                                    ]
                                  }
                                ),
                                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                                  "input",
                                  {
                                    type: "number",
                                    min: 1,
                                    value: seatChange,
                                    onChange: (e) => setSeatChange(
                                      e.target.value === "" ? "" : Number.parseInt(e.target.value, 10)
                                    ),
                                    style: {
                                      flex: 1,
                                      minWidth: "150px",
                                      maxWidth: "220px",
                                      padding: "0.5rem 0.75rem",
                                      borderRadius: "0.5rem",
                                      border: `1px solid ${(_k = theme.borderColor) != null ? _k : "#000000"}`,
                                      fontSize: "0.9rem"
                                    },
                                    placeholder: "Number of seats"
                                  }
                                )
                              ]
                            }
                          ),
                          seatChange && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                            "div",
                            {
                              style: {
                                marginTop: "0.25rem",
                                fontSize: "0.8rem"
                              },
                              children: renderSeatChangePreview()
                            }
                          )
                        ] })
                      ]
                    }
                  ),
                  seatCustomerId && seatMeterId && seatEventTimestamp && (invoiceLoading || invoiceInfo || invoiceError) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    "div",
                    {
                      style: {
                        marginTop: "1rem",
                        marginBottom: "1rem",
                        padding: "1rem",
                        borderRadius: "0.75rem",
                        border: `1px solid ${theme.mode === "dark" ? "#4b5563" : "#e5e7eb"}`,
                        backgroundColor: theme.mode === "dark" ? "#020617" : "#f5f7ff"
                      },
                      children: invoiceLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                        "div",
                        {
                          style: {
                            fontSize: "0.9rem"
                          },
                          children: "Loading invoice details\u2026"
                        }
                      ) : invoiceError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                        "div",
                        {
                          style: {
                            fontSize: "0.9rem"
                          },
                          children: invoiceError
                        }
                      ) : invoiceInfo ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                        "div",
                        {
                          style: {
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.4rem",
                            fontSize: "0.9rem"
                          },
                          children: [
                            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
                              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontWeight: 600 }, children: "Invoice:" }),
                              " ",
                              invoiceInfo.invoice_number || invoiceInfo.invoice_id
                            ] }),
                            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
                              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontWeight: 600 }, children: "Current seats_balance:" }),
                              " ",
                              (_l = invoiceInfo.seats_balance) != null ? _l : "N/A"
                            ] }),
                            invoiceInfo.minimum_seats != null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
                              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontWeight: 600 }, children: "Minimum seats:" }),
                              " ",
                              invoiceInfo.minimum_seats
                            ] })
                          ]
                        }
                      ) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                        "div",
                        {
                          style: {
                            fontSize: "0.9rem"
                          },
                          children: "No matching invoice found for this customer, meter, and date."
                        }
                      )
                    }
                  ),
                  seatEventError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    "div",
                    {
                      style: {
                        marginBottom: "0.75rem",
                        padding: "0.6rem 0.75rem",
                        borderRadius: "0.5rem",
                        border: "1px solid #f97316",
                        backgroundColor: "#fffbeb",
                        color: "#7c2d12",
                        fontSize: "0.85rem"
                      },
                      children: seatEventError
                    }
                  ),
                  seatEventSuccess && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    "div",
                    {
                      style: {
                        marginBottom: "0.75rem",
                        padding: "0.6rem 0.75rem",
                        borderRadius: "0.5rem",
                        border: "1px solid #22c55e",
                        backgroundColor: "#ecfdf3",
                        color: "#14532d",
                        fontSize: "0.85rem"
                      },
                      children: seatEventSuccess
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    "button",
                    {
                      type: "button",
                      onClick: handleCreateSeatEvent,
                      disabled: seatEventLoading,
                      style: {
                        marginTop: "0.25rem",
                        padding: "0.5rem 1.25rem",
                        borderRadius: "999px",
                        border: `1px solid ${(_m = theme.borderColor) != null ? _m : "#000000"}`,
                        backgroundColor: seatEventLoading ? (_n = theme.backgroundColor) != null ? _n : "#ffffff" : (_o = theme.primaryColor) != null ? _o : "#000000",
                        color: seatEventLoading ? (_p = theme.primaryColor) != null ? _p : "#000000" : theme.mode === "dark" ? "#000000" : "#ffffff",
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        cursor: seatEventLoading ? "default" : "pointer",
                        opacity: seatEventLoading ? 0.6 : 1
                      },
                      children: seatEventLoading ? "Saving\u2026" : "Add Seat Event"
                    }
                  )
                ]
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
              "div",
              {
                style: {
                  backgroundColor: (_q = theme.backgroundColor) != null ? _q : "#ffffff",
                  borderRadius: "0.9rem",
                  border: `1px solid ${theme.mode === "dark" ? "#4b5563" : "#e5e7eb"}`,
                  padding: "1.25rem 1.05rem 1.35rem"
                },
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    "h2",
                    {
                      style: {
                        fontSize: "1.02rem",
                        fontWeight: 600,
                        marginBottom: "0.9rem"
                      },
                      children: "Recent Seat Events"
                    }
                  ),
                  eventsError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    "div",
                    {
                      style: {
                        marginBottom: "0.75rem",
                        padding: "0.6rem 0.75rem",
                        borderRadius: "0.5rem",
                        border: "1px solid #f97316",
                        backgroundColor: "#fffbeb",
                        color: "#7c2d12",
                        fontSize: "0.85rem"
                      },
                      children: eventsError
                    }
                  ),
                  eventsLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    "div",
                    {
                      style: {
                        padding: "2rem",
                        textAlign: "center",
                        fontSize: "0.9rem"
                      },
                      children: "Loading seat events\u2026"
                    }
                  ) : events.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    "div",
                    {
                      style: {
                        padding: "2rem",
                        textAlign: "center",
                        fontSize: "0.9rem"
                      },
                      children: "No seat events found."
                    }
                  ) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    "div",
                    {
                      style: {
                        borderRadius: "0.75rem",
                        border: `1px solid ${theme.mode === "dark" ? "#4b5563" : "#e5e7eb"}`,
                        overflow: "hidden",
                        backgroundColor: (_r = theme.backgroundColor) != null ? _r : "#ffffff"
                      },
                      children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                        "table",
                        {
                          style: {
                            width: "100%",
                            borderCollapse: "collapse",
                            fontSize: "0.875rem"
                          },
                          children: [
                            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                              "thead",
                              {
                                style: {
                                  backgroundColor: theme.mode === "dark" ? "#020617" : "#ffffff",
                                  borderBottom: `1px solid ${(_s = theme.borderColor) != null ? _s : "#000000"}`
                                },
                                children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
                                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                                    "th",
                                    {
                                      style: {
                                        textAlign: "left",
                                        padding: "0.6rem 0.9rem",
                                        fontWeight: 600
                                      },
                                      children: "Time"
                                    }
                                  ),
                                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                                    "th",
                                    {
                                      style: {
                                        textAlign: "left",
                                        padding: "0.6rem 0.9rem",
                                        fontWeight: 600
                                      },
                                      children: "Customer"
                                    }
                                  ),
                                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                                    "th",
                                    {
                                      style: {
                                        textAlign: "left",
                                        padding: "0.6rem 0.9rem",
                                        fontWeight: 600
                                      },
                                      children: "Seat Meter"
                                    }
                                  ),
                                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                                    "th",
                                    {
                                      style: {
                                        textAlign: "left",
                                        padding: "0.6rem 0.9rem",
                                        fontWeight: 600
                                      },
                                      children: "Change"
                                    }
                                  ),
                                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                                    "th",
                                    {
                                      style: {
                                        textAlign: "left",
                                        padding: "0.6rem 0.9rem",
                                        fontWeight: 600
                                      },
                                      children: "Balance"
                                    }
                                  )
                                ] })
                              }
                            ),
                            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: events.map((ev) => {
                              var _a2, _b2, _c2;
                              const customer = (_a2 = connection.customers.find(
                                (c) => c.id === ev.customer_id
                              )) != null ? _a2 : null;
                              const meter = (_b2 = seatMeters.find((m) => m.id === ev.seat_meter_id)) != null ? _b2 : null;
                              const date = ev.event_timestamp ? new Date(ev.event_timestamp).toLocaleString() : "";
                              const changeText = ev.event_type === "added" ? `+${ev.seats_added}` : `-${ev.seats_removed}`;
                              return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                                "tr",
                                {
                                  style: {
                                    borderTop: `1px solid ${theme.mode === "dark" ? "#4b5563" : "#000000"}`,
                                    backgroundColor: (_c2 = theme.backgroundColor) != null ? _c2 : "#ffffff"
                                  },
                                  children: [
                                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                                      "td",
                                      {
                                        style: {
                                          padding: "0.65rem 0.9rem"
                                        },
                                        children: date
                                      }
                                    ),
                                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                                      "td",
                                      {
                                        style: {
                                          padding: "0.65rem 0.9rem"
                                        },
                                        children: (customer == null ? void 0 : customer.name) || ev.customer_id
                                      }
                                    ),
                                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                                      "td",
                                      {
                                        style: {
                                          padding: "0.65rem 0.9rem"
                                        },
                                        children: (meter == null ? void 0 : meter.name) || ev.seat_meter_id
                                      }
                                    ),
                                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                                      "td",
                                      {
                                        style: {
                                          padding: "0.65rem 0.9rem"
                                        },
                                        children: changeText
                                      }
                                    ),
                                    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                                      "td",
                                      {
                                        style: {
                                          padding: "0.65rem 0.9rem"
                                        },
                                        children: [
                                          ev.balance_before,
                                          " \u2192 ",
                                          ev.balance_after
                                        ]
                                      }
                                    )
                                  ]
                                },
                                ev.id
                              );
                            }) })
                          ]
                        }
                      )
                    }
                  )
                ]
              }
            )
          ]
        }
      )
    }
  );
}

// src/initSonicWidget.tsx
var import_client = require("react-dom/client");
var import_jsx_runtime2 = require("react/jsx-runtime");
function initSonicWidget(config) {
  const _a = config, { target } = _a, widgetConfig = __objRest(_a, ["target"]);
  const element = typeof target === "string" ? document.querySelector(target) : target;
  if (!element) {
    throw new Error(
      `initSonicWidget: target "${String(target)}" not found in the document.`
    );
  }
  let root;
  if (element._sonicWidgetRoot) {
    root = element._sonicWidgetRoot;
  } else {
    root = (0, import_client.createRoot)(element);
    element._sonicWidgetRoot = root;
  }
  root.render(/* @__PURE__ */ (0, import_jsx_runtime2.jsx)(SonicWidget, __spreadValues({}, widgetConfig)));
  return {
    destroy: () => {
      root.unmount();
      if (element._sonicWidgetRoot) {
        delete element._sonicWidgetRoot;
      }
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SonicWidget,
  initSonicWidget
});
