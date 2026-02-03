![streamfire icon](img/sicon-55x55.png) streamfire  
==========
[![Build Status](https://travis-ci.org/kelveden/streamfire.png?branch=master)](https://travis-ci.org/kelveden/streamfire)

Simple [Campfire](http://campfirenow.com) client that streams the room to terminal stdout.

I have used it on both Mac and Linux but should work fine on any POSIX terminal that supports [ANSI colours](http://en.wikipedia.org/wiki/ANSI_escape_code#Colors).

> IMPORTANT: streamfire is no longer under active development. This is because Campfire itself is effectively abandonware in all but name these days. Alternatives to Campfire that I've used and heartily recommend: [Flowdock](https://www.flowdock.com/) and [Slack](http://slack.com). I personally prefer Flowdock slightly but Slack is a good option if you have a small team - it has a freemium model.

> IMPORTANT: If you want to use notifications you'll need the imagemagick library installed on your system (this is a requirement of the [node-imagemagick](https://github.com/rsms/node-imagemagick) module that streamfire uses internally). This will typically be available via your favourite package manager (e.g. `brew install imagemagick`) or directly from the [imagemagick folks](http://www.imagemagick.org/script/binary-releases.php).

Features
--------

* Stream the content from a specified campfire room to stdout.
* Send messages to the same room via stdin.
* Paste multi-line messages.

That's it. Well, that's not completely true; there are a few bonus features too:

* Auto-complete the name of a user in the room with the tab key.
* List the users currently logged into the room.
* Open the room in a browser.
* Search a given room for messages matching a specific search term.
* Print out the transcript from an entire day for a given room.
* Automatically play sounds posted to a given room.

To get the most from streamfire you'll need a terminal emulator that supports ANSI colours - Personally, I use [terminology](https://www.enlightenment.org/p.php?p=about/terminology) from the Enlightenment project if only because you just need to click on image links from streamfire to see a popup of the image :-)

Installation
------------
streamfire runs as a nodejs executable. So, to create a global symlink to the streamfire binaries:

    npm install -g streamfire

Or, if you prefer to use from source then take advantage of `npm link`:

    git clone git@github.com:kelveden/streamfire.git
    cd streamfire
    npm install
    sudo npm link
  
That will create a symlink from the source into your global node modules. Reverse the process with `sudo npm unlink`.

Configuration
-------------
streamfire needs to know your Campfire API token and domain. To this end create a file `~/.streamfire/config.json` and put
the following in it:

    {
      "domain": "your-campfire-domain",
      "apiToken": "your-campfire-api-token",
      "alertOn": [ "match1", "match2", ..., "matchX" ],
      "locale": "en-GB",
      "showTodaysAlertsOnStartup": false,
      "playSounds": false,
      "rooms": [
        { "id": 1234, "alias": "myroom" },
        { "id": 5678, "alias": "anotherroom" }
      ]
    }

 * The `domain` is your campfirenew domain; e.g. `mydomain.campfirenow.com`. 
 * The `apiToken` is your API authentication token as provided in your "myinfo" section of Campfire itself.
 * The `alertOn` field is a list of text fragments to match against messages in each room. (Each text fragment is treated as a case-insensitive
regular expression internally; so feel free to use regular expressions.) When a match occurs the body of the matching
message will be sent as a notification to the underlying OS. (You'll need imagemagick installed - please read the note on notifications at the very top of this README for more details.)
 * The `locale` field is used to format dates in the room output. (Defaults to "en-GB" if not specified.)
 * If true, the `showTodaysAlertsOnStartup` flag tells streamfire to automatically display all old alerts for the day whenever
 you startup streamfire. (i.e. Exactly the same as pressing 'F4'.) Default is `false`.
 * If true, the `playSounds` flag tells streamfire to automatically play sound messages posted to the room. (NOTE: This involves
 shelling out to `mplayer` and so requires that application to be installed.)
 * The `rooms` field allows specification of room aliases so that you can enter the alias rather than the room id at the command line
 (e.g. `streamfire myroom` instead of `streamfire 1234`.)

Usage
-----
### To list all available rooms and aliases

    streamfire

### To join a room:

    streamfire (<your-room-id>|<your-room-alias>)

E.g. `streamfire myroom`. If you connect successfully you'll get shown all the recent messages in the room.

### To search a room:

    streamfire-search (<your-room-id>|<your-room-alias>) <search-term>
    
E.g. `streamfire-search myroom "some term"`. The output will be a list of all messages that match "some term".

### To see a transcript for a room:

    streamfire-transcript (<your-room-id>|<your-room-alias>) [(<date>|<day offset>)]

E.g.
 * `streamfire-transcript myroom 2014-01-01` - transcript for 1st October 2014.
 * `streamfire-transcript myroom` - transcript from today.
 * `streamfire-transcript myroom 1` - transcript from yesterday.
 * `streamfire-transcript myroom 2` - transcript from 2 days ago.

Creating new messages
---------------------
 * Simply type into stdin and hit `<Enter>` to send a message to the room.
 * Paste in multi-line text into a single message - but make sure that the last line has a carriage return at the end, otherwise that line won't be sent.
 * Start typing the name of a user already in the room and then use tab to auto-complete.

More goodies
------------

Press `F1` once in a room to get a list of the available hotkeys. They currently are:

 * `F1`: Display help
 * `F2`: List users currently in room
 * `F3`: Open room in default browser
 * `F4`: Re-show alerts from today
 * `F5`: Reload messages from today - useful if lots of interaction between you and other users has created a bit of a mess on-screen as messages criss-cross stdin and stdout.

Contributing
------------
If you want to contribute or fork streamfire here are a few of things to note:
 
 * To get started just pull down the source and run `npm install` within its directory.
 * Build tool is [gulp](http://gulpjs.com/). Just run `gulp` from the source root to run a full build and tests.
 * If you want to use streamfire from source, just
   - Uninstall the streamfire binary itself: `npm uninstall -g streamfire`
   - See the installation notes further up about creating a global symlink with npm. 
 * You can get streamfire to output diagnostics information by simply adding the switch "--debug" to the command line; e.g. `streamfire myroom --debug`.
 * There is NOT 100% test code coverage. I've created what I think seems sensible but, quite frankly, given the fact that streamfire's main role
 is to stream stuff back and forth, creating such tests would be difficult to create in a maintainable way. And given that the functionality of
 streamfire can very quickly be tested just by joining a room it I'm not convinced that the effort is worth it.
 * That being said, I do like to see tests where feasible :-)

Acknowledgements
----------------
Streamfire icon comes courtesy of [murfious](https://github.com/murfious)
