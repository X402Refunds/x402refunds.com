# x402 Refund Requests

## Integration Guide for Merchants

### What you’re adding
1) A `Link` header on your paid endpoint responses (**200/402**) advertising your **refund contact email**
2) A `Link` header on your **successful paid 200** responses advertising the **refund request endpoint**
3) (Optional) Refund credits for one-click refunds

After steps 1–2, refund requests can reach you by email.

### Step 1 — Add a `Link` header with your refund email (refund contact)
Include this header on your paid endpoint responses (GET + POST). Return it on both 200 and 402. Use `mailto:` as the Link target:

```txt
Link: <mailto:refunds@yourdomain.com>; rel="https://x402refunds.com/rel/refund-contact"
```

What matters:
- The `<...>` target should be `mailto:refunds@yourdomain.com`
- Use the email address you want to receive refund requests at

### Step 2 — Add a `Link` header on your successful paid 200 responses (refund request discoverability)
Include this header in your normal successful response (the `200 OK` you return after a paid request):

```txt
Link: <https://api.x402refunds.com/v1/refunds>; rel="https://x402refunds.com/rel/refund-request"; type="application/json"
```

### Step 3 — Add refund credits (optional)
If you want one-click refunds from the refund request email, add refund credits:
- Top up here: `/topup`
