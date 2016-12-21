# panoptes-researcher-dashboard
A dashboard for the researchers running projects on the Zooniverse Panoptes Citizen Science platform

# Design/Functionality 
Users can access dashboard without being logged in.
“Home page” - seeing the different available visualisations
Project selector

## Landing page:
* V1.0 this will privde a overview of the different visualisations/tools available to the user.
 * a drop down list of projects will be shown, selecting a project will update the streams and UI
* V2.0 will allow users to log in and configure the panel
 * logged in users (based on privilidges will be able to communicate with other users)
 
## First: tab pane is the current number of active users, including world map
+ 10 minute window to calculate active users (server side)
+ When user activity is clicked on (it might be a marker on the map), then more info about that user (if possible) is shown.


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
 * Image freshness
 * Classification on User 
 * Admin
 * Scientist

## Third: trending Word/hashtags which represent the most talked about strings within the comments
* List them using a ranked table (combine both hashtags and words). Stop words to be removed.
* On Click:
 * Use Search API to search for similar images/
* Filter:
 * All time trends
 * Top rising
 * Temporal slider to identify time window for trending/top words

## Four: research feed: shows what the researchers have been active on.
* Temporally ordered stream of events including:
 * Commenting
  *diff
 * (and that’s it for now, folks)

## Five: Unanswered questions that require attention of researchers/moderators
