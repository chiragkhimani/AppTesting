# Hostinger Deployment Bundle

Everything you need to deploy the QA Demo Store on Hostinger shared hosting.

```
hostinger-deploy/
├── api/              ← PHP REST endpoints (upload to public_html/api/)
│   ├── db.php        ← EDIT credentials here
│   ├── login.php
│   ├── users.php
│   ├── products.php
│   └── orders.php
├── sql/
│   ├── schema.sql    ← Run first in phpMyAdmin
│   └── seed.sql      ← Run second (3 users + 6 products)
├── .htaccess         ← Upload to public_html/.htaccess (React Router)
└── DEPLOYMENT.md     ← Step-by-step instructions
```

See **DEPLOYMENT.md** for full instructions.
