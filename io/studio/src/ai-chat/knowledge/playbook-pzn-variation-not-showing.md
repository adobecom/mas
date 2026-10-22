---
topic: playbook-pzn-variation-not-showing
keywords: platform, authoring, personalized variation not showing on a page
---
<!-- ported from the MASA knowledge corpus -->
# Personalized variation not showing on a page

## Symptom

Reports look like "I published a grouped variation with the right tag but the page still shows the default", "the Target activity fires and I can see other parts of the experience, but the card content does not change", or "one field changed and the others did not". Check how the page asks for the variation before suspecting the variation itself.

## Step 1: work out which route the page uses

Look at the authored link behind the card. If its hash carries a `pzn` value, the page uses whole card personalization and IO picks the variation by tag. If it does not, the only way content changes is a manifest row rewriting a field, and the variation's tags are irrelevant to that path.

A quick browser check: the card only appends a `pzn` parameter to its fragment request when it has a `pzn` value, so a request without one is not using the tag route, whatever tags the variation has. Do not spend time on tags, publish state or tag scoring until this is settled, because on the manifest route none of them participate.

## Step 2: reproduce without a Target token

An MEP manifest can be force applied straight from the URL, which removes Target, audiences and preview tokens from the picture:

`?mep=<url-encoded manifest path>--<variant column name>`

Chain more than one with `---`. Load the page with and without it and compare, which separates "the manifest is wrong" from "the activity is not reaching me".

Be careful about caching here. A manifest JSON has been observed served from the edge with a true TTL far longer than the `max-age` its own response advertised, so a page kept applying the previous version of a manifest for a while after an edit was published. Fetch the manifest path directly with a cache busting query parameter to see what the origin actually holds, and compare that against what the page loaded, before concluding an edit did not take.

## Step 3: compare the manifest field string against the page

This is a frequent break. MEP matches the field name as an exact string, so the `field=` in the manifest row has to be character for character what the page authored.

Read the page source and list the `field=` values it uses, then read the manifest rows. A row saying `field=ctas` will not apply to a page that authored `ctas[2u25ddjvjn]`, and neither will a row using a different index. Any `field=` written on the replacement side of the row is discarded, so only the selector side matters.

While you are there, check each row's `query=` id against the fragment ids the page authors. A row naming a variation id rather than an authored card id can never match and is inert.

## Step 4: check the variation actually defines the field

On the manifest route the page renders the variation fragment directly, with no parent underneath. A field that the variation does not define resolves to nothing, and the element is hidden rather than falling back to the parent's value.

So if one field personalizes and another stays default or goes blank, open the variation and confirm it has its own value for every field a manifest row points at. A variation that only overrides, say, the description cannot serve a row that asks it for a CTA or a subtitle.

## Step 5: for CTAs, check the data-key

CTA rows usually carry an index. A numeric index selects by position. Any other index is first matched against the fragment's labels field for that field, `ctaLabels` for CTAs, when the fragment has one: the CTA at the matching label's position is used, and if no label matches, the field is hidden. Only when the fragment has no labels field is the index looked up as an anchor whose `data-key` matches it. If nothing matches, the field is hidden and nothing is rendered or logged.

Anchors in a variation do not automatically carry the same `data-key` as the equivalent anchor in the parent, so a variation authored separately can end up with a different key. When a CTA row applies but renders nothing, compare the index the manifest and the page ask for with the variation's `ctaLabels` entries if it has them, and otherwise with the `data-key` on its anchor, and make them agree.

## Step 6: check the CTA text resolves

A CTA whose label is a placeholder token renders the raw token when the key does not exist for that surface and locale, and a token written with a space can never resolve. If a button shows something like `{{buy now}}`, the fix is the token in the variation, not the personalization wiring. The placeholders concept covers how to confirm a key against the dictionary index.

## A diagnostic trap when reading the rendered page

Do not conclude a field is not personalizable just because you cannot find a `mas-field` element wrapping the rendered content. On a marquee block this has been seen with a CTA: the resolved anchor ended up outside its original wrapper in the final DOM, while the wrapper that failed to resolve stayed behind as a hidden empty element.

Searching the DOM for `mas-field` can therefore show you only the broken ones and none of the working ones, which reads as "this field is not wired up at all". Confirm against the page source and against a control load of the page instead, and compare the rendered element's attributes, such as a CTA's `href` and `data-key`, between the personalized and default loads.
