---
name: Clerk signed-in route behavior
description: Prevents confusing redirects when a signed-in user visits a custom sign-in route.
---

Custom sign-in routes must branch on Clerk authentication state before rendering the SignIn component. Clerk's single-session behavior automatically redirects when SignIn is rendered for an already signed-in user, which can discard a requested destination such as an app-admin page.

**Why:** The sign-in page is also used as a return point for protected routes, and signed-in users may revisit it while following a deep link. Rendering SignIn in that state makes the navigation look broken even though authentication succeeded.

**How to apply:** Render SignIn only for signed-out users. For signed-in users, show a local continuation view with explicit links to the requested protected destination and the normal portal. Preserve a protected deep-link target through any multi-step sign-in flow.