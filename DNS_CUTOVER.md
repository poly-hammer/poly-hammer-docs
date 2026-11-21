# Manual DNS cutover: GitHub Pages to Vercel

**Owner-operated final launch step. Do not execute this checklist until the production deployment and its content have been explicitly approved and verified.** The agent must leave DNS unchanged. Production deployment itself also requires separate approval; preparing these instructions does not authorize one.

## Current configuration and rollback values

Read-only checks on November 21, 2026 found:

| Setting | Observed value |
| --- | --- |
| Public DNS nameservers | AWS Route 53 (`ns-1671.awsdns-16.co.uk`, `ns-249.awsdns-31.com`, `ns-839.awsdns-40.net`, `ns-1138.awsdns-14.org`) |
| Name | `docs.polyhammer.com` |
| Record type | `A` |
| Values | `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` |
| TTL | 300 seconds |
| CNAME / AAAA | Neither returned by the DNS queries |
| GitHub Pages custom domain | `docs.polyhammer.com`, configured for workflow-based publishing |
| Destination Vercel project | `polyhammer-docs-production` in `poly-hammers-projects` |

Recheck the actual Route 53 record before editing and save its complete configuration, including routing policy. These observations are a rollback reference, not a substitute for the current record.

## Finish the site before switching traffic

1. Complete the production approval and historical backfill checks in [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md). Keep CLI and Motion hidden. Confirm the final site SHA, release catalog, media, legacy redirects, search, Markdown, MCP, and the production version dropdown.
2. As part of the approved launch preparation, open [the production project's Domains settings](https://vercel.com/poly-hammers-projects/polyhammer-docs-production/settings/domains), add **docs.polyhammer.com** to its production environment, and copy the exact DNS target Vercel displays. Adding the project domain does not change Route 53 records. If Vercel requests ownership verification, follow its specific TXT instructions yourself before continuing; do not remove the existing traffic-routing A record yet.
3. Confirm these GitHub Actions **repository variables**:

   | Variable | Value before cutover |
   | --- | --- |
   | `DOCS_PRODUCTION_URL` | `https://docs.polyhammer.com` |
   | `DOCS_PRODUCTION_VERIFY_URL` | `https://polyhammer-docs-production.vercel.app` |

   The approved build uses the final public origin for canonical links, sitemap, and agent URLs. Before DNS moves, the workflow verifies both domain aliases through Vercel's API and runs HTTP/MCP checks through the production project's Vercel hostname. Both aliases must target the same tested deployment in the same project. Public DNS still serves GitHub Pages until you change it.
4. After reviewing the final production build, change **only this production project's** Deployment Protection to **Standard Protection**, which permits custom-domain visitors and keeps deployment URLs protected. Keep staging protected. Confirm the protected Vercel hostname still works for authorized review. The public domain must permit anonymous human readers and MCP clients at launch. [Vercel protection modes](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication)
5. Save the tested deployment ID/URL and successful workflow run. Keep the old GitHub Pages deployment and custom-domain association intact for rollback. Verify the `docs` TTL remains 300; if lowering it from a larger value, wait out the old TTL before switching traffic.

Vercel supplies a project-specific CNAME target for a subdomain. **Copy the target shown for this project; do not guess a shared Vercel hostname or use the staging project's target.** The target is intentionally not filled in here because the live custom domain has not been attached. [Vercel custom-domain configuration](https://vercel.com/docs/domains/working-with-domains/add-a-domain)

## Switch DNS yourself

1. Sign in to the AWS account that owns the public **polyhammer.com** hosted zone. Open **Route 53 → Hosted zones → polyhammer.com → Records**.
2. Locate the existing **docs.polyhammer.com A** record and save/export its values and settings. Remove that record, then create the replacement below. A CNAME cannot coexist with A/AAAA records at the same name. If an AAAA record has appeared since the audit, save it and remove it as part of the same change. Use an atomic record change batch if that is your normal Route 53 workflow; otherwise perform the console replacement together in the cutover window.

   | Field | New value |
   | --- | --- |
   | Record name | `docs` |
   | Type | `CNAME` |
   | Alias toggle | Off |
   | Value | Exact production-project CNAME target copied from Vercel |
   | TTL | `300` |
   | Routing policy | Simple, unless the existing zone deliberately uses another policy |

3. Leave the `polyhammer.com` apex, `www`, nameservers, MX/email records, and unrelated TXT records unchanged. Moving this one subdomain does not require transferring the domain or changing nameservers. [Route 53 record editing](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resource-record-sets-editing.html)
4. In Vercel Domains, wait for valid DNS configuration and a valid HTTPS certificate. Check the final URL from a logged-out browser and a network that is not relying on your old DNS cache.

## Verify the public site and close out

In PowerShell, these read-only commands check public resolution and the deployed catalog:

```powershell
Resolve-DnsName docs.polyhammer.com -Type CNAME -Server 1.1.1.1
Resolve-DnsName docs.polyhammer.com -Type CNAME -Server 8.8.8.8
Invoke-RestMethod https://docs.polyhammer.com/api/versions
```

The CNAME must match Vercel's displayed target, HTTPS must be valid, and the catalog must report `production` with stable released versions. CLI, Motion, `next`, and the excluded internal pages must remain unavailable. Check the homepage, images, old bookmarked URLs, `/index.md`, `/llms.txt`, `/sitemap.xml`, search, and an MCP client connecting to `/api/mcp`. Canonical and citation URLs must use `https://docs.polyhammer.com`.

Once public DNS and HTTPS checks pass, remove the **DOCS_PRODUCTION_VERIFY_URL** repository variable so future workflow smoke tests use the public hostname. This changes the verification destination; it does not require rebuilding canonical URLs, which were already correct before cutover. Run the HTTP/MCP smoke checks against the live domain using the published catalog. Confirm the desired automatic release/reviewer policy with the owner before resuming unattended publication.

After propagation and the agreed rollback window, open [GitHub Pages settings](https://github.com/poly-hammer/poly-hammer-docs/settings/pages) and remove its custom domain. Do not remove this association while users may still be reaching the old GitHub Pages addresses. Preserve the old deployment/artifact for recovery. This repository uses workflow-based Pages publishing, so changing a repository `CNAME` file is not the control for its Pages domain. [GitHub custom-domain settings](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)

## Rollback

If the new public site fails, set `DOCS_PRODUCTION_ENABLED=false` to stop further publication. Ensure GitHub Pages is still published and has `docs.polyhammer.com` configured; restore that association first if it was removed. Replace the new Route 53 CNAME with the exact saved A record (and any other saved record that was intentionally removed), initially using its saved TTL. The observed original A values are listed above. Verify DNS, HTTPS, and the old site while caches refresh. Preserve the Vercel deployment and its logs for investigation.

No DNS mutation, project-domain attachment, GitHub Pages domain removal, or production deployment was performed while preparing this checklist.
