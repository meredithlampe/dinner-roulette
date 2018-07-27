/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';


// Shortcuts to DOM Elements.
var newPartyForm = document.getElementById('new-party-form');
var dateInput = document.getElementById('new-party-date');
var locationInput = document.getElementById('new-party-location');
var signInButton = document.getElementById('sign-in-button');
var signOutButton = document.getElementById('sign-out-button');
var splashPage = document.getElementById('page-splash');
var addPost = document.getElementById('add-post');
var addButton = document.getElementById('add');
var attendParty = document.getElementById('attend-party');
var attendPartySubmit = document.getElementById('attend-party-submit');
var otherPeopleAreBringingList = document.getElementsByClassName('other-people-are-bringing-list')[0];
var willBringInput = document.getElementById('attend-party-bring-item-input');
var recentPostsSection = document.getElementById('recent-posts-list');
var userPostsSection = document.getElementById('user-posts-list');
var topUserPostsSection = document.getElementById('top-user-posts-list');
var partiesSection = document.getElementById('parties-list');
var partiesSectionAttendees = document.getElementById('parties-list-attendees');
var recentMenuButton = document.getElementById('menu-recent');
var myPostsMenuButton = document.getElementById('menu-my-posts');
var myTopPostsMenuButton = document.getElementById('menu-my-top-posts');
var partiesMenuButton = document.getElementById('menu-parties');
var partiesAttendeeViewMenuButton = document.getElementById('menu-parties-attendee-view');
var listeningFirebaseRefs = [];

/**
 * Saves a new post to the Firebase DB.
 */
// [START write_fan_out]
function writeNewPost(uid, username, picture, title, body) {
  // A post entry.
  var postData = {
    author: username,
    uid: uid,
    body: body,
    title: title,
    starCount: 0,
    authorPic: picture
  };  

  // Get a key for a new Post.
  var newPostKey = firebase.database().ref().child('posts').push().key;

  // Write the new post's data simultaneously in the posts list and the user's post list.
  var updates = {};
  updates['/posts/' + newPostKey] = postData;
  updates['/user-posts/' + uid + '/' + newPostKey] = postData;

  return firebase.database().ref().update(updates);
}
// [END write_fan_out]

/**
 * Saves a new post to the Firebase DB.
 */
// [START write_fan_out]
function makeNewDinnerParty(uid, username, picture, date, location) {

  // var partyId = generatePartyIdForUserid(uid);

  var partyData = {
    // id: partyId,
    host: username,
    hostPic: picture,
    uid: uid,
    location: location,
    date: date,
    time: "1900",
  }

  // Get a key for a new event.
  var newEventKey = firebase.database().ref().child('events').push().key;

  // Write the new post's data simultaneously in the posts list and the user's post list.
  var updates = {};
  updates['/events/' + newEventKey] = partyData;

  return firebase.database().ref().update(updates);
}
// [END write_fan_out]

// function generatePartyIdForUserid(uid) {
//   var secondsPartyCreated = new Date().getTime() / 1000;
//   var to_hash = secondsPartyCreated + '' + uid;
//   var hash = 0, i, chr;
//   if (to_hash === 0) return hash;
//   for (i = 0; i < to_hash; i++) {
//     chr   = to_hash.charCodeAt(i);
//     hash  = ((hash << 5) - hash) + chr;
//     hash |= 0; // Convert to 32bit integer
//   }
//   return hash;
// }

/**
 * Star/unstar post.
 */
// [START post_stars_transaction]
function toggleStar(postRef, uid) {
  postRef.transaction(function(post) {
    if (post) {
      if (post.stars && post.stars[uid]) {
        post.starCount--;
        post.stars[uid] = null;
      } else {
        post.starCount++;
        if (!post.stars) {
          post.stars = {};
        }
        post.stars[uid] = true;
      }
    }
    return post;
  });
}
// [END post_stars_transaction]

/**
 * Creates a post element.
 */
function createPostElement(postId, title, text, author, authorId, authorPic) {
  var uid = firebase.auth().currentUser.uid;

  var html =
      '<div class="post post-' + postId + ' mdl-cell mdl-cell--12-col ' +
                  'mdl-cell--6-col-tablet mdl-cell--4-col-desktop mdl-grid mdl-grid--no-spacing">' +
        '<div class="mdl-card mdl-shadow--2dp">' +
          '<div class="mdl-card__title mdl-color--light-blue-600 mdl-color-text--white">' +
            '<h4 class="mdl-card__title-text"></h4>' +
          '</div>' +
          '<div class="header">' +
            '<div>' +
              '<div class="avatar"></div>' +
              '<div class="username mdl-color-text--black"></div>' +
            '</div>' +
          '</div>' +
          '<span class="star">' +
            '<div class="not-starred material-icons">star_border</div>' +
            '<div class="starred material-icons">star</div>' +
            '<div class="star-count">0</div>' +
          '</span>' +
          '<div class="text"></div>' +
          '<div class="comments-container"></div>' +
          '<form class="add-comment" action="#">' +
            '<div class="mdl-textfield mdl-js-textfield">' +
              '<input class="mdl-textfield__input new-comment" type="text">' +
              '<label class="mdl-textfield__label">Comment...</label>' +
            '</div>' +
          '</form>' +
        '</div>' +
      '</div>';

  // Create the DOM element from the HTML.
  var div = document.createElement('div');
  div.innerHTML = html;
  var postElement = div.firstChild;
  if (componentHandler) {
    componentHandler.upgradeElements(postElement.getElementsByClassName('mdl-textfield')[0]);
  }

  var addCommentForm = postElement.getElementsByClassName('add-comment')[0];
  var commentInput = postElement.getElementsByClassName('new-comment')[0];
  var star = postElement.getElementsByClassName('starred')[0];
  var unStar = postElement.getElementsByClassName('not-starred')[0];

  // Set values.
  postElement.getElementsByClassName('text')[0].innerText = text;
  postElement.getElementsByClassName('mdl-card__title-text')[0].innerText = title;
  postElement.getElementsByClassName('username')[0].innerText = author || 'Anonymous';
  postElement.getElementsByClassName('avatar')[0].style.backgroundImage = 'url("' +
      (authorPic || './silhouette.jpg') + '")';

  // Listen for comments.
  // [START child_event_listener_recycler]
  var commentsRef = firebase.database().ref('post-comments/' + postId);
  commentsRef.on('child_added', function(data) {
    addCommentElement(postElement, data.key, data.val().text, data.val().author);
  });

  commentsRef.on('child_changed', function(data) {
    setCommentValues(postElement, data.key, data.val().text, data.val().author);
  });

  commentsRef.on('child_removed', function(data) {
    deleteComment(postElement, data.key);
  });
  // [END child_event_listener_recycler]

  // Listen for likes counts.
  // [START post_value_event_listener]
  var starCountRef = firebase.database().ref('posts/' + postId + '/starCount');
  starCountRef.on('value', function(snapshot) {
    updateStarCount(postElement, snapshot.val());
  });
  // [END post_value_event_listener]

  // Listen for the starred status.
  var starredStatusRef = firebase.database().ref('posts/' + postId + '/stars/' + uid);
  starredStatusRef.on('value', function(snapshot) {
    updateStarredByCurrentUser(postElement, snapshot.val());
  });

  // Keep track of all Firebase reference on which we are listening.
  listeningFirebaseRefs.push(commentsRef);
  listeningFirebaseRefs.push(starCountRef);
  listeningFirebaseRefs.push(starredStatusRef);

  // Create new comment.
  addCommentForm.onsubmit = function(e) {
    e.preventDefault();
    createNewComment(postId, firebase.auth().currentUser.displayName, uid, commentInput.value);
    commentInput.value = '';
    commentInput.parentElement.MaterialTextfield.boundUpdateClassesHandler();
  };

  // Bind starring action.
  var onStarClicked = function() {
    var globalPostRef = firebase.database().ref('/posts/' + postId);
    var userPostRef = firebase.database().ref('/user-posts/' + authorId + '/' + postId);
    toggleStar(globalPostRef, uid);
    toggleStar(userPostRef, uid);
  };
  unStar.onclick = onStarClicked;
  star.onclick = onStarClicked;

  return postElement;
}

/**
 * Creates a party element.
 */
function createPartyElement(partyId, host, date, location, hostPic) {
  var uid = firebase.auth().currentUser.uid;
  var postElement = getPartyElement(partyId);

  var addPartyNeedForm = postElement.getElementsByClassName('new-party-need-form')[0];
  var partyNeedInput = postElement.getElementsByClassName('new-party-need')[0];
  var archivePartyButton = postElement.getElementsByClassName('archive-party-button')[0];

  // Set values.
  postElement.getElementsByClassName('date')[0].innerText = date;
  postElement.getElementsByClassName('location')[0].innerText = location;
  postElement.getElementsByClassName('mdl-card__title-text')[0].innerText = host + '\'s Party';
  // postElement.getElementsByClassName('username')[0].innerText = author || 'Anonymous';
  postElement.getElementsByClassName('avatar')[0].style.backgroundImage = 'url("' +
      (hostPic || './silhouette.jpg') + '")';
  // TODO: show party needs

    // Listen for party needs.
  // [START child_event_listener_recycler]
  var partyNeedsRef = firebase.database().ref('party-needs/' + partyId);
  partyNeedsRef.on('child_added', function(data) {
    addPartyNeedElement(postElement, data.key, data.val().needText, data.val().claimedBy);
  });

  // TODO: handle change and remove events for party needs
  // commentsRef.on('child_changed', function(data) {
  //   setCommentValues(postElement, data.key, data.val().text, data.val().author);
  // });

  // commentsRef.on('child_removed', function(data) {
  //   deleteComment(postElement, data.key);
  // });

  // var partiesRef = firebase.database().ref('events');


  // [END child_event_listener_recycler]

  // Keep track of all Firebase reference on which we are listening.
  listeningFirebaseRefs.push(partyNeedsRef);

  // Create new party need.
  addPartyNeedForm.onsubmit = function(e) {
    e.preventDefault();
    // createNewComment(postId, firebase.auth().currentUser.displayName, uid, commentInput.value);
    createNewPartyNeed(partyId, partyNeedInput.value);
    partyNeedInput.value = '';
    partyNeedInput.parentElement.MaterialTextfield.boundUpdateClassesHandler();
  };  

  // add attendees section
  var attendeesRef = firebase.database().ref('party-attendees/' + partyId);
  attendeesRef.on('child_added', function(data) {
    console.log(data.val().bringingText);
    addAttendeeElement(postElement, data.key, data.val().attendeeName, data.val().bringingText);
  });
  listeningFirebaseRefs.push(attendeesRef);

  archivePartyButton.onclick = function(e) {
    e.preventDefault();
    archiveParty(partyId);
  }

  return postElement;
}

function addAttendeeElement(element, key, attendeeName, bringingText) {

  // get parent container
  var attendeesContainer = element.getElementsByClassName('party-attendees-container')[0];

  // show attendee name
  var attendee = document.createElement('div');
  attendee.classList.add('party-need');
  attendee.innerText = attendeeName;
  attendeesContainer.appendChild(attendee);

  // show attendee 'what will you bring' text
  var bringingTextDiv = document.createElement('div');
  bringingTextDiv.classList.add('attendee-bringing-text');
  bringingTextDiv.innerText = bringingText;
  attendeesContainer.appendChild(bringingTextDiv);
}

function createPartyElementAttendeeView(partyId, host, date, location, hostPic) {
  var html =
      '<div class="post post-' + partyId + ' mdl-cell mdl-cell--12-col ' +
                  'mdl-cell--6-col-tablet mdl-cell--4-col-desktop mdl-grid mdl-grid--no-spacing">' +
        '<div class="mdl-card mdl-shadow--2dp">' +
          '<div class="mdl-card__title mdl-color--light-blue-600 mdl-color-text--white">' +
            '<h4 class="mdl-card__title-text">' + date + '</h4>' +
          '</div>' +
          // '<div class="header">' +
          //   '<div>' +
          //     '<div class="username mdl-color-text--black"></div>' +
          //   '</div>' +
          // '</div>' +
          '<div class="party-content-container">' +
            // '<div class="party-content-item date"></div>' +
            '<div class="party-content-item location"></div>' + 
            '<form id="new-attendee-form" action="#">' + 
              '<button type="submit" class="attend-party-button party-content-item mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect">' + 
                'Attend Party' + 
              '</button>' + 
            '</form>' +
          '</div>' +
        '</div>' +
      '</div>';

    // Create the DOM element from the HTML.
    var div = document.createElement('div');
    div.innerHTML = html;
    var partyElement = div.firstChild;
    var attendButton = partyElement.getElementsByClassName("attend-party-button")[0];

    attendButton.onclick = function() {
      showSection(attendParty);
        // add attendees section
      var attendeesRef = firebase.database().ref('party-attendees/' + partyId);
      attendeesRef.on('child_added', function(data) {
        var bringing = document.createElement('li');
        bringing.innerHTML = data.val().bringingText;
        otherPeopleAreBringingList.appendChild(bringing);
      });
      listeningFirebaseRefs.push(attendeesRef);
      willBringInput.value = '';
      attendPartySubmit.onclick = function() {
        return firebase.database().ref('/users/' + firebase.auth().currentUser.uid).once('value').then(function(snapshot) {
          var username = (snapshot.val() && snapshot.val().username) || 'Anonymous';
          // [START_EXCLUDE]
          return addNewPartyAttendee(partyId, firebase.auth().currentUser.uid, username, willBringInput.value);
          // [END_EXCLUDE]
        });
        
      }
    };

    // if (componentHandler) {
    //   componentHandler.upgradeElements(partyElement.getElementsByClassName('mdl-textfield')[0]);
    // }

  // Set values.
  // partyElement.getElementsByClassName('date')[0].innerText = date;
  partyElement.getElementsByClassName('location')[0].innerText = location;

  return partyElement;
}

function getPartyElement(partyId) {
  var html =
      '<div class="post post-' + partyId + ' mdl-cell mdl-cell--12-col ' +
                  'mdl-cell--6-col-tablet mdl-cell--4-col-desktop mdl-grid mdl-grid--no-spacing">' +
        '<div class="mdl-card mdl-shadow--2dp">' +
          '<div class="mdl-card__title mdl-color--light-blue-600 mdl-color-text--white">' +
            '<h4 class="mdl-card__title-text"></h4>' +
          '</div>' +
          '<div class="header">' +
            '<div>' +
              '<div class="avatar"></div>' +
              '<div class="username mdl-color-text--black"></div>' +
            '</div>' +
          '</div>' +
          '<div class="party-content-container">' +
            '<div class="party-content-item date"></div>' +
            '<div class="party-content-item location"></div>' + 
            // '<form id="new-attendee-form" action="#">' + 
            //   '<button type="submit" class="party-content-item mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect">' + 
            //     'Attend Party' + 
            //   '</button>' + bfcu
            // '</form>' +
          '<h5 class="party-needs-header">Attendees</h5>' +
          '<div class="party-attendees-container"></div>' +
          '<h5 class="party-needs-header">Dishes Requested</h5>' +
            '<form id="new-party-need-form" action="#" class="new-party-need-form">' + 
              '<div class="mdl-textfield mdl-js-textfield new-party-need-form-input-container">' +
                '<input class="mdl-textfield__input new-party-need" type="text">' +
                '<label class="mdl-textfield__label">Add dish...</label>' +
              '</div>' +
            '</form>' +
            '<div class="party-needs-container"></div>' +
            '<form id="archive-party-form" action="#">' + 
              '<button type="submit" class="archive-party-button party-content-item mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect">' + 
                'Archive Party' + 
              '</button>' + 
            '</form>' +
          '</div>' +
        '</div>' +
      '</div>';

    // Create the DOM element from the HTML.
    var div = document.createElement('div');
    div.innerHTML = html;
    var partyElement = div.firstChild;
    if (componentHandler) {
      componentHandler.upgradeElements(partyElement.getElementsByClassName('mdl-textfield')[0]);
    }
    return partyElement;
}

function archiveParty(partyId) {
  firebase.database().ref('events/' + partyId).remove();
}

/**
 * Writes a new comment for the given post.
 */
function createNewComment(postId, username, uid, text) {
  firebase.database().ref('post-comments/' + postId).push({
    text: text,
    author: username,
    uid: uid
  });
}

function createNewPartyNeed(partyId, needText) {
  firebase.database().ref().child('party-needs/' + partyId).push({
    partyId: partyId,
    needText: needText,
  });
}

function addNewPartyAttendee(partyId, attendeeUid, attendeeName, bringingText) {
  firebase.database().ref().child('party-attendees/' + partyId).push({
    partyId: partyId,
    attendeeUid: attendeeUid,
    attendeeName: attendeeName,
    bringingText: bringingText,
  });
}

/**
 * Updates the starred status of the post.
 */
function updateStarredByCurrentUser(postElement, starred) {
  if (starred) {
    postElement.getElementsByClassName('starred')[0].style.display = 'inline-block';
    postElement.getElementsByClassName('not-starred')[0].style.display = 'none';
  } else {
    postElement.getElementsByClassName('starred')[0].style.display = 'none';
    postElement.getElementsByClassName('not-starred')[0].style.display = 'inline-block';
  }
}

/**
 * Updates the number of stars displayed for a post.
 */
function updateStarCount(postElement, nbStart) {
  postElement.getElementsByClassName('star-count')[0].innerText = nbStart;
}

/**
 * Creates a comment element and adds it to the given postElement.
 */
function addCommentElement(postElement, id, text, author) {
  var comment = document.createElement('div');
  comment.classList.add('comment-' + id);
  comment.innerHTML = '<span class="username"></span><span class="comment"></span>';
  comment.getElementsByClassName('comment')[0].innerText = text;
  comment.getElementsByClassName('username')[0].innerText = author || 'Anonymous';

  var commentsContainer = postElement.getElementsByClassName('comments-container')[0];
  commentsContainer.appendChild(comment);
}

/**
 * Creates a party needs element and adds it to the given postElement.
 */
function addPartyNeedElement(postElement, id, needText, claimed_by) {
  var partyNeed = document.createElement('div');
  partyNeed.classList.add('party-need');
  // partyNeed.innerHTML = '<span class="username"></span><span class="comment"></span>';
  partyNeed.innerText = needText;
  // partyNeed.getElementsByClassName('username')[0].innerText = claimed_by || 'Anonymous';

  var commentsContainer = postElement.getElementsByClassName('party-needs-container')[0];
  commentsContainer.appendChild(partyNeed);
}

/**
 * Sets the comment's values in the given postElement.
 */
function setCommentValues(postElement, id, text, author) {
  var comment = postElement.getElementsByClassName('comment-' + id)[0];
  comment.getElementsByClassName('comment')[0].innerText = text;
  comment.getElementsByClassName('fp-username')[0].innerText = author;
}

/**
 * Deletes the comment of the given ID in the given postElement.
 */
function deleteComment(postElement, id) {
  var comment = postElement.getElementsByClassName('comment-' + id)[0];
  comment.parentElement.removeChild(comment);
}

/**
 * Starts listening for new posts and populates posts lists.
 */
function startDatabaseQueries() {
  // [START my_top_posts_query]
  var myUserId = firebase.auth().currentUser.uid;
  var topUserPostsRef = firebase.database().ref('user-posts/' + myUserId).orderByChild('starCount');
  // [END my_top_posts_query]
  // [START recent_posts_query]
  var recentPostsRef = firebase.database().ref('posts').limitToLast(100);
  // [END recent_posts_query]
  var userPostsRef = firebase.database().ref('user-posts/' + myUserId);
  var partiesRef = firebase.database().ref('events');
  var partiesAttendeesRef = firebase.database().ref('events');

  var fetchPosts = function(postsRef, sectionElement) {
    postsRef.on('child_added', function(data) {
      var author = data.val().author || 'Anonymous';
      var containerElement = sectionElement.getElementsByClassName('posts-container')[0];
      containerElement.insertBefore(
        createPostElement(data.key, data.val().title, data.val().body, author, data.val().uid, data.val().authorPic),
        containerElement.firstChild);
    });
    postsRef.on('child_changed', function(data) {
      var containerElement = sectionElement.getElementsByClassName('posts-container')[0];
      var postElement = containerElement.getElementsByClassName('post-' + data.key)[0];
      postElement.getElementsByClassName('mdl-card__title-text')[0].innerText = data.val().title;
      postElement.getElementsByClassName('username')[0].innerText = data.val().author;
      postElement.getElementsByClassName('text')[0].innerText = data.val().body;
      postElement.getElementsByClassName('star-count')[0].innerText = data.val().starCount;
    });
    postsRef.on('child_removed', function(data) {
      var containerElement = sectionElement.getElementsByClassName('posts-container')[0];
      var post = containerElement.getElementsByClassName('post-' + data.key)[0];
      post.parentElement.removeChild(post);
    });
  };

  var fetchParties = function(ref, sectionElement) {
    ref.on('child_added', function(data) {
      var host = data.val().host || 'Anonymous';
      var containerElement = sectionElement.getElementsByClassName('posts-container')[0];
      containerElement.insertBefore(
        createPartyElement(data.key, data.val().host, data.val().date, data.val().location, data.val().hostPic),
        containerElement.firstChild);
    });
    ref.on('child_changed', function(data) {
      var containerElement = sectionElement.getElementsByClassName('posts-container')[0];
      var postElement = containerElement.getElementsByClassName('post-' + data.key)[0];
      postElement.getElementsByClassName('mdl-card__title-text')[0].innerText = data.val().host + '\'s Party';
      // postElement.getElementsByClassName('username')[0].innerText = data.val().author;
      postElement.getElementsByClassName('text')[0].innerText = data.val().date;
    });
    ref.on('child_removed', function(data) {
      var containerElement = sectionElement.getElementsByClassName('posts-container')[0];
      var post = containerElement.getElementsByClassName('post-' + data.key)[0];
      post.parentElement.removeChild(post);
    });
  }

  var fetchPartiesAttendees = function(ref, sectionElement) {
    ref.on('child_added', function(data) {
      var host = data.val().host || 'Anonymous';
      var containerElement = sectionElement.getElementsByClassName('posts-container')[0];
      containerElement.insertBefore(
        createPartyElementAttendeeView(data.key, data.val().host, data.val().date, data.val().location, data.val().hostPic),
        containerElement.firstChild);
    });
    // ref.on('child_changed', function(data) {
    //   var containerElement = sectionElement.getElementsByClassName('posts-container')[0];
    //   var postElement = containerElement.getElementsByClassName('post-' + data.key)[0];
    //   postElement.getElementsByClassName('mdl-card__title-text')[0].innerText = data.val().host + '\'s Party';
    //   // postElement.getElementsByClassName('username')[0].innerText = data.val().author;
    //   postElement.getElementsByClassName('text')[0].innerText = data.val().date;
    // });
    // ref.on('child_removed', function(data) {
    //   var containerElement = sectionElement.getElementsByClassName('posts-container')[0];
    //   var post = containerElement.getElementsByClassName('post-' + data.key)[0];
    //   post.parentElement.removeChild(post);
    // });
  }

  // Fetching and displaying all posts of each sections.
  fetchPosts(topUserPostsRef, topUserPostsSection);
  fetchPosts(recentPostsRef, recentPostsSection);
  fetchPosts(userPostsRef, userPostsSection);
  fetchParties(partiesRef, partiesSection);
  fetchPartiesAttendees(partiesAttendeesRef, partiesSectionAttendees);


  // Keep track of all Firebase refs we are listening to.
  listeningFirebaseRefs.push(topUserPostsRef);
  listeningFirebaseRefs.push(recentPostsRef);
  listeningFirebaseRefs.push(userPostsRef);
  listeningFirebaseRefs.push(partiesRef);
  listeningFirebaseRefs.push(partiesAttendeesRef);
}

/**
 * Writes the user's data to the database.
 */
// [START basic_write]
function writeUserData(userId, name, email, imageUrl) {
  firebase.database().ref('users/' + userId).set({
    username: name,
    email: email,
    profile_picture : imageUrl
  });
}
// [END basic_write]

/**
 * Cleanups the UI and removes all Firebase listeners.
 */
function cleanupUi() {
  // Remove all previously displayed posts.
  topUserPostsSection.getElementsByClassName('posts-container')[0].innerHTML = '';
  recentPostsSection.getElementsByClassName('posts-container')[0].innerHTML = '';
  userPostsSection.getElementsByClassName('posts-container')[0].innerHTML = '';

  // Stop all currently listening Firebase listeners.
  listeningFirebaseRefs.forEach(function(ref) {
    ref.off();
  });
  listeningFirebaseRefs = [];
}

/**
 * The ID of the currently signed-in User. We keep track of this to detect Auth state change events that are just
 * programmatic token refresh but not a User status change.
 */
var currentUID;

/**
 * Triggers every time there is a change in the Firebase auth state (i.e. user signed-in or user signed out).
 */
function onAuthStateChanged(user) {
  // We ignore token refresh events.
  if (user && currentUID === user.uid) {
    return;
  }

  cleanupUi();
  if (user) {
    currentUID = user.uid;
    splashPage.style.display = 'none';
    writeUserData(user.uid, user.displayName, user.email, user.photoURL);
    startDatabaseQueries();
  } else {
    // Set currentUID to null.
    currentUID = null;
    // Display the splash page where you can sign-in.
    splashPage.style.display = '';
  }
}

/**
 * Creates a new post for the current user.
 */
function newPostForCurrentUser(title, text) {
  // [START single_value_read]
  var userId = firebase.auth().currentUser.uid;
  return firebase.database().ref('/users/' + userId).once('value').then(function(snapshot) {
    var username = (snapshot.val() && snapshot.val().username) || 'Anonymous';
    // [START_EXCLUDE]
    return writeNewPost(firebase.auth().currentUser.uid, username,
      firebase.auth().currentUser.photoURL,
      title, text);
    // [END_EXCLUDE]
  });
  // [END single_value_read]
}

function newDinnerPartyWithCurrentUserAsHost(date, location) {
  var userId = firebase.auth().currentUser.uid;
  return firebase.database().ref('/users/' + userId).once('value').then(function(snapshot) {
    var username = (snapshot.val() && snapshot.val().username) || 'Anonymous';
    // [START_EXCLUDE]
    return makeNewDinnerParty(firebase.auth().currentUser.uid, username,
      firebase.auth().currentUser.photoURL,
      date, location);
    // [END_EXCLUDE]
  });
}

/**
 * Displays the given section element and changes styling of the given button.
 */
function showSection(sectionElement, buttonElement) {
  recentPostsSection.style.display = 'none';
  userPostsSection.style.display = 'none';
  topUserPostsSection.style.display = 'none';
  partiesSection.style.display = 'none';
  partiesSectionAttendees.style.display = 'none';
  addPost.style.display = 'none';
  attendParty.style.display = 'none';

  recentMenuButton.classList.remove('is-active');
  myPostsMenuButton.classList.remove('is-active');
  myTopPostsMenuButton.classList.remove('is-active');
  partiesMenuButton.classList.remove('is-active');
  partiesAttendeeViewMenuButton.classList.remove('is-active');

  if (sectionElement) {
    sectionElement.style.display = 'block';
  }
  if (buttonElement) {
    buttonElement.classList.add('is-active');
  }
}

// Bindings on load.
window.addEventListener('load', function() {
  // Bind Sign in button.
  signInButton.addEventListener('click', function() {
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider);
  });

  // Bind Sign out button.
  signOutButton.addEventListener('click', function() {
    firebase.auth().signOut();
  });

  // Listen for auth state changes
  firebase.auth().onAuthStateChanged(onAuthStateChanged);

  // Saves message on form submit.
  newPartyForm.onsubmit = function(e) {
    e.preventDefault();
    var date = dateInput.value;
    var location = locationInput.value;
    if (date && location) {
      newDinnerPartyWithCurrentUserAsHost(date, location);
      dateInput.value = '';
      locationInput.value = '';
      showSection(partiesSection, partiesMenuButton);
    }
  };

  // Bind menu buttons.
  recentMenuButton.onclick = function() {
    showSection(recentPostsSection, recentMenuButton);
  };
  myPostsMenuButton.onclick = function() {
    showSection(userPostsSection, myPostsMenuButton);
  };
  myTopPostsMenuButton.onclick = function() {
    showSection(topUserPostsSection, myTopPostsMenuButton);
  };
  partiesMenuButton.onclick = function() {
    showSection(partiesSection, partiesMenuButton);
  };
  partiesAttendeeViewMenuButton.onclick = function() {
    showSection(partiesSectionAttendees, partiesAttendeeViewMenuButton);
  };
  addButton.onclick = function() {
    showSection(addPost);
    dateInput.value = '';
    locationInput.value = '';
  };
  partiesAttendeeViewMenuButton.onclick();
}, false);
