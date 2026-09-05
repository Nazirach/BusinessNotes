# Batch 1 Browser Verification Notes

## Profile

Authenticated preview session displayed the user `big money` and returned `Profile saved` after submitting headline `Authenticated Operator QA`, location `Jakarta`, industry `Food systems`, and bio `Profile persistence verification`. A subsequent page reload followed by reopening Profile showed the same four values populated by the server query. Network log captured `business.profile` returning `userId: 1170001` with those persisted values.

## Company

Authenticated preview session submitted `Nusantara QA Foods`, `Food systems`, `Jakarta`, `https://example.com/qa-foods`, and `A persisted company record for Batch 1 verification.` The UI then showed the created company in the owned Companies list. A final reload is still required before marking Company persistence complete.

## Company reload result

After reloading the preview and reopening Companies, `Nusantara QA Foods` remained visible with `Food systems · Jakarta` and the persisted description. This confirms the authenticated UI → `business.createCompany` → database → `business.companies` → UI → reload path for the Company flow.

## Create Post

Authenticated preview session opened the normal composer, submitted the post `Batch 1 persistence verification: Indonesian operators need practical partnerships that turn trusted information into measurable action.`, showed `Publishing...`, and then rendered a new feed item authored by `big money` with the exact submitted content and `Business update` label. A final reload is still required before marking Create Post persistence complete.

## Create Post reload result

After reloading the preview, the submitted post remained at the top of the feed with author `big money`, `Business update`, and the exact content. This confirms the authenticated UI → `business.createPost` → database → `business.list` → UI → reload path.

## Profile mutation proof

A second authenticated Profile save changed the headline from `Authenticated Operator QA` to the unique value `Authenticated Operator QA 1920`. The UI entered `Saving...` and returned to the idle `Save profile` state without an error. A reload-and-reopen check is still required for this unique value.

## Profile unique-value reload result

After saving the unique headline `Authenticated Operator QA 1920`, reloading the page, and reopening Profile, the same unique value was returned in the input along with the other persisted fields. This removes the earlier ambiguity that the reload might only be showing pre-existing data.
