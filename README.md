# panoptes-researcher-dashboard
A dashboard for the researchers running projects on the Zooniverse Panoptes Citizen Science platform

# Design/Functionality 
Users can access dashboard without being logged in.
“Home page” - seeing the different available visualisations
Project selector

## First: tab pane is the current number of active users, including world map
+ 10 minute window to calculate active users (server side)

## Second: image visualisation for popular talked about images. Tree map which shows the image proportionate to the number of comments it has gained
* Rollover: 
  * Not logged in, no identification of image if previously seen
  * Logged in, notifies the user seen/not seen
* Click:
  * Take them to the thread on the Zoo talk page
  * Storing the event (image/resource) as a personally curated item.
* Filtering Options:
  * Comments on Image
  * Comment rate
Image freshness
Classification on User 
Admin
Scientist

## Third: trending Word/hashtags which represent the most talked about strings within the comments
List them using a ranked table (combine both hashtags and words). Stop words to be removed.
On Click:
Use Search API to search for similar images/
Filter:
All time trends
Top rising
Temporal slider to identify time window for trending/top words

## Four: research feed: shows what the researchers have been active on.
Temporally ordered stream of events including:
Commenting
diff
(and that’s it for now, folks)

## Five: Unanswered questions that require attention of researchers/moderators
