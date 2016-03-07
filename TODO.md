


## New To Do: ##

### Bugs: ###
- Cannot edit links after scrolling (on a long screen)
  - Think this has something to do with the clearing of the left box on scroll
  - Confirmed, but need this to happen to prevent trash icon from moving with the scroll
### Features: ###
- Should reduce the # of clicks needed (seems like we have to keep dropping down top bar)
- Links should automatically unhide in edit/draw modes and go back to previous state afterwards
- Keyboard shortcuts would be nice
- Some sort of warning when leaving a page which has not been saved (name has not been given)
- Page name should not look like textbox except when editing/hovering
- Should preview image when user selects one (before they click "Save")
- Should allow for different users & different projects
- Should have "screens linking to here" information


### Refactoring: ###
- ~~Move flow.html to a Jade template~~
- Move logic out of routes on server side
- Look into floweditor.js and main.js client libraries
- Move storage to Postgres? - Maybe not worth the LOE

---

## Old To Do: ##

### Quick TODO: ###
- When animating the new page load, we should also scroll to the top
- Pressing Enter on the Page Name should blur() the box (and not result in a new line)
  - Whenever the blur() event is fired, we should check to see if the text has changed, and if so then enable 'Apply' (but not change the text in the Pages until it is applied)