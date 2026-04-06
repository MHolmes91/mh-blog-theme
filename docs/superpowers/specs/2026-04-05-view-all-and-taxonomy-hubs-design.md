# View All And Taxonomy Hubs Design

## Goal

Refine the home and all-posts pages so the homepage emphasizes recent posts while the dedicated all-posts page becomes the place for broader browsing. The homepage should show only the five most recent posts and link to the full post archive, while the all-posts page should use its intro/left area for series and tag hubs instead of the current note content.

## Scope

This change covers:

- Limiting the homepage recent-post list to the five most recent posts
- Adding a `View All posts` link below the homepage recent-post list
- Including a right-pointing chevron icon in that link
- Replacing the current all-posts-page intro area with:
  - a series hub rendered as regular text links
  - a tags hub rendered as chip-style links

This change does not cover:

- Changes to taxonomy term pages themselves
- Broader navigation redesign
- Changes to other list surfaces beyond the homepage and dedicated all-posts page

## Page Responsibilities

### Home

The homepage should remain the compact recent-content surface.

Requirements:

- Show only the five most recent posts
- Keep the current row-based post summaries for those entries
- Add a `View All posts` link at the bottom of the recent-post list
- Include a right-pointing chevron icon in the link

Purpose:

- Home stays focused and scannable
- Users have an obvious route to the full archive/listing surface

### Dedicated All-Posts Page

The all-posts page should become the broader browsing hub.

Requirements:

- Keep the full posts listing on the main/list side
- Do not keep the current `Mark's Notes` note/intro content on this page
- Use that left/intro area instead for taxonomy hubs

The replacement hub area should contain:

1. Series hub first
   - render all series as regular text links
   - present them as simple stacked lines, not chips

2. Tags hub second
   - render all tags as chip-style links

This preserves the current two-column/intro-plus-list layout language while giving the all-posts page a stronger browsing purpose.

## Ordering And Presentation

### Series Hub

- Appears first in the all-posts left area
- Uses regular text-link presentation
- Should read like a simple browsable list rather than a decorative pill grid

### Tags Hub

- Appears below the series hub
- Uses chip-style links
- Should remain compact and scannable

The visual distinction between the two hubs should reinforce their different roles.

## Icon Requirement

The homepage `View All posts` link should include a right-pointing chevron icon.

Requirements:

- Keep the icon lightweight and consistent with the existing icon system
- The icon should support the link rather than dominate it

## Data Sources

This change should use Hugo’s existing content/taxonomy data rather than introducing new configuration.

Expected sources:

- recent homepage posts from the regular posts collection, sorted by recency
- all-posts page listing from the full regular-post collection
- series hub from the site’s series taxonomy
- tags hub from the site’s tags taxonomy

## Testing And Verification

This change should be verified through integration/build behavior rather than new unit tests.

Expected verification focus:

- homepage shows exactly five recent posts
- homepage shows a working `View All posts` link with chevron icon
- all-posts page shows the full post list
- all-posts page left/intro area contains:
  - series links first
  - tag chips second
- existing browsing-surface behavior remains intact
- build and existing E2E suite stay healthy after the template updates

## Theme Change Policy For This Pass

This is a narrow template/content-routing change.

Allowed:

- template changes to the homepage and all-posts page
- small test updates/additions needed to verify the new behavior
- small icon partial additions if needed for the chevron icon

Not intended:

- broad footer/header/navigation changes
- taxonomy term page redesign
- new data models or new configuration requirements

## Expected Outcomes

After this change:

- the homepage shows a tighter five-post recent list
- users can jump clearly to the full post listing via `View All posts`
- the all-posts page becomes a stronger browse hub by surfacing series and tags in its left area
- the main all-posts list remains the canonical full archive of posts

## Design Decisions Summary

- Keep home focused on five recent posts only
- Add a `View All posts` CTA with a chevron icon under the homepage list
- Replace the all-posts page intro area with taxonomy hubs instead of note content
- Order those hubs as series first, tags second
- Render series as regular links and tags as chips
