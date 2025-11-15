# Release Checklist

- [ ] Update `CHANGELOG.md` with user-facing changes
- [ ] Bump version in `package.json` (if applicable)
- [ ] Run full test suite (`npm test`)
- [ ] Run E2E tests (`npm run test:e2e`) or smoke tests
- [ ] Verify evaluation summary is within acceptable thresholds (if applicable)
- [ ] Build and test production artifacts (`npm run build`)
- [ ] Deploy to staging and run smoke tests
- [ ] Schedule release and update stakeholders
- [ ] Post-deploy sanity checks and monitoring alerts
- [ ] Publish release notes
