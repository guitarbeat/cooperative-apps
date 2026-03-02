const HTTP_PROXY_KEYS = ['npm_config_http_proxy', 'npm_config_HTTP_PROXY'];

const normalizedValue = HTTP_PROXY_KEYS.map((key) => process.env[key]).find((value) => Boolean(value));

if (normalizedValue && !process.env.npm_config_proxy) {
  process.env.npm_config_proxy = normalizedValue;
}

for (const key of HTTP_PROXY_KEYS) {
  if (key in process.env) {
    delete process.env[key];
  }
}
