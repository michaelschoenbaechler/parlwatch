# parlwatch

An app for following the Swiss federal parliament: its businesses, members, votes and debates.

## Language

### Insights

**Topic**:
One of the 28 official subject areas parliament assigns to a business (`TagNames`); a business usually has several.
_Avoid_: Category, tag, theme

**Follow**:
A user's standing interest in a topic or a single business, used to notify them of changes. German UI label: «beobachten».
_Avoid_: Subscribe, bookmark

**Finished business**:
A followed business that parliament has settled (status «Erledigt»); it stays in the user's follows for quick access but receives no further updates.
_Avoid_: Closed, archived, done

**Topic digest**:
The daily notification that lists the businesses newly submitted in a user's followed topics, sent only on days with something new.
_Avoid_: Summary, newsletter, feed

**Speaking time**:
How long a member spoke for themselves in one council, excluding speeches as rapporteur, chair or Federal Council.
_Avoid_: Talk time, airtime

**Disclosure**:
A passage in a speech where a member declares their interests in the business, as Art. 11 Abs. 3 ParlG requires, including a declaration of having none.
_Avoid_: Interest declaration, conflict notice

**Device**:
One installation of the app. It is the only identity the backend knows; there are no accounts and no users behind it.
_Avoid_: User, subscriber, account

**Registration**:
What a device sends so it can be notified: its push token, language and follows. A device without follows or push permission has none, and a registration not renewed for 90 days is deleted.
_Avoid_: Subscription, sign-up, profile
