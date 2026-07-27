# Hostinger Deployment Bundle

Everything you need to deploy the QA Demo Store on Hostinger shared hosting.

```
hostinger-deploy/
├── api/              ← PHP REST endpoints (upload to public_html/playground/api/)
│   ├── db.php        ← EDIT credentials here
│   ├── products.php
│   ├── signup.php
│   ├── profile.php
│   ├── orders.php
│   ├── cancel-order.php
│   └── auth/
│       ├── login.php
│       └── forgot-password.php
├── swagger/          ← Swagger UI (upload to public_html/playground/swagger/)
│   ├── index.html
│   └── openapi.yaml
├── sql/
│   ├── schema.sql         ← Run first in phpMyAdmin (fresh)
│   ├── seed.sql           ← Run second (3 users + 6 products)
│   └── migration_v4.sql   ← Existing v3 DB → add orders.status
├── .htaccess         ← Upload to public_html/playground/.htaccess (React Router)
└── DEPLOYMENT.md     ← Step-by-step instructions
```

**Live app:** https://chiragkhimani.in/playground  
**Live API:** https://chiragkhimani.in/playground/api  
**Live Swagger docs:** https://chiragkhimani.in/playground/swagger/

See **DEPLOYMENT.md** for full instructions.
