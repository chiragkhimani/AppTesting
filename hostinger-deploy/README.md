# Hostinger Deployment Bundle

Everything you need to deploy the QA Demo Store on Hostinger shared hosting.

```
hostinger-deploy/
├── api/              ← PHP REST endpoints (upload to public_html/api/)
│   ├── db.php        ← EDIT credentials here
│   ├── products.php
│   ├── signup.php
│   ├── profile.php
│   ├── orders.php
│   └── auth/login.php
├── docs/             ← Swagger UI (upload to public_html/docs/)
│   ├── index.html
│   └── openapi.yaml
├── sql/
│   ├── schema.sql    ← Run first in phpMyAdmin
│   └── seed.sql      ← Run second (3 users + 6 products)
├── .htaccess         ← Upload to public_html/.htaccess (React Router)
└── DEPLOYMENT.md     ← Step-by-step instructions
```

**Live Swagger docs:** https://seleniumbootcamp.in/docs/

See **DEPLOYMENT.md** for full instructions.
