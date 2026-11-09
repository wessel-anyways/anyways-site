# anyways.

The one-page site for anyways, a performance marketing agency for DTC and lead-gen brands.

## Hosting on GitHub Pages

1. Create a new repo and upload `index.html` to the root.
2. Go to **Settings → Pages → Build and deployment**, choose **Deploy from a branch**, select `main` and `/ (root)`, then **Save**.
3. The site will be live at `https://<your-username>.github.io/<repo-name>/` within about a minute.

To use your own domain, add it under **Settings → Pages → Custom domain**, and point a CNAME record at `<your-username>.github.io`.

## Before launch

- The social links are placeholders (the contact email is wessel@anyways.co.za).
- The audit form sends each request to the Google Sheet "anyways. Audit requests" (via an Apps Script web app) and emails wessel@anyways.co.za. The script source is in ../audit-form-apps-script.gs. When replacing index.html with a new export, re-apply the form hook with ../apply-form-hook.py.
