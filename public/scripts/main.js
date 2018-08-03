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
var titleInput = document.getElementById('new-party-title');
var dateInput = document.getElementById('new-party-date');
var locationInput = document.getElementById('new-party-location');
var descriptionInput = document.getElementById('new-party-description');
var signInButton = document.getElementById('sign-in-button');
var signInButtonFacebook = document.getElementById('sign-in-button-facebook');
var signOutButton = document.getElementById('sign-out-button');
// var splashPage = document.getElementById('page-splash');
var addPost = document.getElementById('add-post');
var addButton = document.getElementById('add');
var attendParty = document.getElementById('attend-party');
var otherPeopleAreBringingList = document.getElementsByClassName('other-people-are-bringing-list')[0];

// attend party inputs
var willBringInput = document.getElementById('attend-party-bring-item-input');
var nameInput = document.getElementById('attend-party-name-input');
var emailInput = document.getElementById('attend-party-email-input');
var attendPartySubmit = document.getElementById('attend-party-submit');

// admin gatekeeper input
var adminInput = document.getElementById('admin-gatekeeper-text-input');
var adminGatekeeperSubmit = document.getElementById('admin-gatekeeper-submit');

// attend confirmation page
var attendConfirmationDetails = document.getElementById('attend-confirmation-details');
var attendConfirmationDoneButton = document.getElementById('attend-confirmation-done');

// sections
var attendConfirmationSection = document.getElementById('attend-confirmation');
var shownSection = 'PARTIES'; // || ADMIN || ADMIN-GATEKEEPER
var partiesSection = document.getElementById('parties-list');
var partiesSectionAttendees = document.getElementById('parties-list-attendees');
var adminGatekeeperSection = document.getElementById('admin-gatekeeper');

var partiesMenuButton = document.getElementById('menu-parties');
var partiesAttendeeViewMenuButton = document.getElementById('menu-parties-attendee-view');
var listeningFirebaseRefs = [];
var isAdmin = false;

// handle admin stuff
var toggleAdminButton = document.getElementsByClassName('toggle-admin')[0];
var inAdminMode = false;
var navBar = document.getElementsByClassName('nav-bar')[0];

/**
 * Saves a new post to the Firebase DB.
 */
// [START write_fan_out]
function makeNewDinnerParty(uid, username, picture, title, date, location, description) {

  // var partyId = generatePartyIdForUserid(uid);

  var partyData = {
    // id: partyId,
    host: username,
    hostPic: picture,
    uid: uid,
    title: title, 
    location: location,
    description: description,
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

/**
 * Creates a party element.
 */
function createPartyElement(partyId, host, title, date, location, description, hostPic, peopleComingRef) {
  var postElement = getPartyElement(partyId);
  var archivePartyButton = postElement.getElementsByClassName('archive-party-button')[0];

  // Set values.
  postElement.getElementsByClassName('date')[0].innerText = date;
  postElement.getElementsByClassName('location')[0].innerText = location;
  if (description) {
    postElement.getElementsByClassName('description')[0].innerText = description;  
  }
  postElement.getElementsByClassName('mdl-card__title-text')[0].innerText = title;
  postElement.getElementsByClassName('avatar')[0].style.backgroundImage = 'url("' +
      (hostPic || './silhouette.jpg') + '")';

  // TODO: show party needs

    // Listen for party needs.
  // [START child_event_listener_recycler]
  // var partyNeedsRef = firebase.database().ref('party-needs/' + partyId);
  // partyNeedsRef.on('child_added', function(data) {
  //   addPartyNeedElement(postElement, data.key, data.val().needText, data.val().claimedBy);
  // });

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
  // listeningFirebaseRefs.push(partyNeedsRef);

  // Create new party need.
  // addPartyNeedForm.onsubmit = function(e) {
  //   e.preventDefault();
  //   // createNewComment(postId, firebase.auth().currentUser.displayName, uid, commentInput.value);
  //   createNewPartyNeed(partyId, partyNeedInput.value);
  //   partyNeedInput.value = '';
  //   partyNeedInput.parentElement.MaterialTextfield.boundUpdateClassesHandler();
  // };  

  // add attendees section
  var attendeesRef = firebase.database().ref('party-attendees/' + partyId);
  attendeesRef.on('child_added', function(data) {
    addAttendeeElement(postElement, data.key, data.val().attendeeName, data.val().attendeeEmail, data.val().bringingText);
  });
  listeningFirebaseRefs.push(attendeesRef);

  archivePartyButton.onclick = function(e) {
    e.preventDefault();
    archiveParty(partyId);
  }

  return postElement;
}

function addAttendeeElement(element, key, attendeeName, attendeeEmail, bringingText) {
  // get parent container
  var attendeesContainer = element.getElementsByClassName('party-attendees-container')[0];

  // show attendee name
  var attendee = document.createElement('div');
  attendee.classList.add('party-need');
  attendee.innerText = attendeeName;
  attendeesContainer.appendChild(attendee);

  // show attendee email
  var emailDiv = document.createElement('div');
  emailDiv.classList.add('attendee-bringing-text');
  emailDiv.innerText = attendeeEmail;
  attendeesContainer.appendChild(emailDiv);

  // show attendee 'what will you bring' text
  var bringingTextDiv = document.createElement('div');
  bringingTextDiv.classList.add('attendee-bringing-text');
  bringingTextDiv.innerText = bringingText;
  attendeesContainer.appendChild(bringingTextDiv);
}

function createPartyElementAttendeeView(partyId, host, title, date, location, description, hostPic, peopleComingRef) {
  var html =
      '<div class="post post-' + partyId + '-attendee mdl-cell mdl-cell--12-col ' +
                  'mdl-cell--6-col-tablet mdl-cell--4-col-desktop mdl-grid mdl-grid--no-spacing">' +
        '<div class="mdl-card mdl-shadow--2dp">' +
          '<div class="mdl-card__title mdl-color--light-blue-600 mdl-color-text--white">' +
            '<h4 class="mdl-card__title-text">' + title + '</h4>' +
          '</div>' +
          // '<div class="header">' +
          //   '<div>' +
          //     '<div class="username mdl-color-text--black"></div>' +
          //   '</div>' +
          // '</div>' +
          '<div class="party-content-container">' +
            // '<div class="party-content-item date"></div>' +
            '<div class="party-content-item date"></div>' + 
            '<div class="party-content-item location"></div>' + 
            '<div class="description"></div>' + 
            '<div class="filler"></div>' +
            '<div class="num-attending-container">' +
              '<div class="num-attending-label">Number attending: </div>' + 
              '<div class="num-attending">0</div><div>/8</div>' + 
            '</div>' + 
            '<form id="new-attendee-form" action="#">' + 
              '<div class="attend-button-container">' +
                '<button type="submit" class="attend-party-button party-content-item mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect">' + 
                  'Attend Party' + 
                '</button>' + 
                '<div class="attend-button-full"></div>'
              '</div>'
            '</form>' +
          '</div>' +
        '</div>' +
      '</div>';

    // Create the DOM element from the HTML.
    var div = document.createElement('div');
    div.innerHTML = html;
    var partyElement = div.firstChild;

    peopleComingRef.on('child_added', function(data) {
      var element = document.getElementsByClassName('post-' + data.val().partyId + '-attendee')[0];
      var numAttending = element.getElementsByClassName('num-attending')[0];
      var num = parseInt(numAttending.innerHTML);
      var newNumAttending = num + 1;
      numAttending.innerHTML = newNumAttending;
      if (newNumAttending >= 8) {
        var attendPartyButton = element.getElementsByClassName('attend-party-button')[0];
        attendPartyButton.disabled = true;
        element.getElementsByClassName('attend-button-full')[0].innerHTML = 'FULL';
      }
    });
    // add attendee status
    // var attendeesRef = firebase.database().ref('party-attendees/' + partyId);
    // attendeesRef.on('child_added', function(data) {
    //   if (data.val().attendeeUid === firebase.auth().currentUser.uid) {
    //     status.innerHTML = 'You\'re attending this party';
    //   }
    // });
    // attendeesRef.on('child_changed', function(data) {
      
    // });
    // attendeesRef.on('child_removed', function(data) {
      
    // });
    // listeningFirebaseRefs.push(attendeesRef);

    var attendButton = partyElement.getElementsByClassName("attend-party-button")[0];
    attendButton.onclick = function() {
      // hide list of things people are bringing to this party
      while (otherPeopleAreBringingList.firstChild) {
          otherPeopleAreBringingList.removeChild(otherPeopleAreBringingList.firstChild);
      }
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
        // return firebase.database().ref('/users/' + firebase.auth().currentUser.uid).once('value').then(function(snapshot) {
          // var username = (snapshot.val() && snapshot.val().username) || 'Anonymous';
          // [START_EXCLUDE]
          var willBring = willBringInput.value;

          addNewPartyAttendee(partyId, null, emailInput.value, nameInput.value, willBring);

          // hide list of things people are bringing to this party
          while (otherPeopleAreBringingList.firstChild) {
              otherPeopleAreBringingList.removeChild(otherPeopleAreBringingList.firstChild);
          }

          // show confirmation page
          attendConfirmationDetails.innerHTML = 
            'We\'ll send and email to <strong>' + emailInput.value + '</strong> with more details soon.';
          willBringInput.value = '';
          nameInput.value = '';
          emailInput.value = '';  
          showSection(attendConfirmationSection);
        }
          // [END_EXCLUDE]
        // });
      }

    // if (componentHandler) {
    //   componentHandler.upgradeElements(partyElement.getElementsByClassName('mdl-textfield')[0]);
    // }

  // Set values.
  partyElement.getElementsByClassName('location')[0].innerText = location;
  partyElement.getElementsByClassName('date')[0].innerText = date;

  if (description) {
    partyElement.getElementsByClassName('description')[0].innerText = description;  
  }
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
            '<div class="party-content-item description"></div>' + 
            // '<form id="new-attendee-form" action="#">' + 
            //   '<button type="submit" class="party-content-item mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect">' + 
            //     'Attend Party' + 
            //   '</button>' + bfcu
            // '</form>' +
          '<h5 class="party-attendees-header">Attendees</h5>' +
          '<div class="party-attendees-container"></div>' +
          '<div class="filler"></div>' +
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
    // if (componentHandler) {
    //   componentHandler.upgradeElements(partyElement.getElementsByClassName('mdl-textfield')[0]);
    // }
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

function addNewPartyAttendee(partyId, attendeeUid, attendeeEmail, attendeeName, bringingText) {
  firebase.database().ref().child('party-attendees/' + partyId).push({
    partyId: partyId,
    attendeeUid: attendeeUid,
    attendeeEmail: attendeeEmail,
    attendeeName: attendeeName,
    bringingText: bringingText,
  });
  //       var updates = {};
  // var currentUserUid = firebase.auth().currentUser.uid;
  // updates['/admins/'] = {uid: currentUserUid};
  // firebase.database().ref().update(updates);
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
  var partiesRef = firebase.database().ref('events');
  var partiesAttendeesRef = firebase.database().ref('events');

  var fetchParties = function(ref, sectionElement) {
    ref.on('child_added', function(data) {
      var host = data.val().host || 'Anonymous';
      var containerElement = sectionElement.getElementsByClassName('posts-container')[0];
      var partiesPeopleComingRef = firebase.database().ref('party-attendees/' + data.key); 
      containerElement.insertBefore(
        createPartyElement(data.key, data.val().host, data.val().title, data.val().date, data.val().location, data.val().description, data.val().hostPic, partiesPeopleComingRef),
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
      var partiesPeopleComingRef = firebase.database().ref('party-attendees/' + data.key); 
      containerElement.insertBefore(
        createPartyElementAttendeeView(data.key, data.val().host, data.val().title, data.val().date, data.val().location, data.val().description, data.val().hostPic, partiesPeopleComingRef),
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

  fetchParties(partiesRef, partiesSection);
  fetchPartiesAttendees(partiesAttendeesRef, partiesSectionAttendees);

  // Keep track of all Firebase refs we are listening to.
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
  // Remove all previously displayed parties.
  partiesSection.getElementsByClassName('posts-container')[0].innerHTML = '';
  partiesSectionAttendees.getElementsByClassName('posts-container')[0].innerHTML = '';

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

function newDinnerPartyWithCurrentUserAsHost(title, date, location, description) {
    return makeNewDinnerParty(null, null,
      null, title,
      date, location, description);
}

/**
 * Displays the given section element and changes styling of the given button.
 */
function showSection(sectionElement, buttonElement) {
  partiesSection.style.display = 'none';
  partiesSectionAttendees.style.display = 'none';
  addPost.style.display = 'none';
  attendParty.style.display = 'none';
  attendConfirmationSection.style.display = 'none';
  adminGatekeeperSection.style.display = 'none';

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
  addButton.onclick = function() {
    showSection(addPost);
    willBringInput.value = '';
    nameInput.value = '';
    emailInput.value = '';  
  };
  addButton.style.display='none'; // hide by default

  adminGatekeeperSubmit.onclick = function() {
    var answer = adminInput.value;
    if (answer === 'blue, no, green') {
        addButton.style.display='';
      showSection(partiesSection);
    }
  }

  // Saves message on form submit.
  newPartyForm.onsubmit = function(e) {
    e.preventDefault();
    var title = titleInput.value;
    var date = dateInput.value;
    var location = locationInput.value;
    var description = descriptionInput.value;
    if (date && location) {
      newDinnerPartyWithCurrentUserAsHost(title, date, location, description);
      titleInput.value = '';
      dateInput.value = '';
      locationInput.value = '';
      descriptionInput.value = '';
      showSection(partiesSection, partiesMenuButton);
    }
  };

  startDatabaseQueries();

  // Bind menu buttons.
  toggleAdminButton.onclick = function() {
    if (shownSection === 'ADMIN') {
      shownSection = 'PARTIES';
      showSection(partiesSectionAttendees);
      addButton.style.display='none';
      isAdmin = false;
    } else {//if (shownSection === 'PARTIES') {
      shownSection = 'ADMIN';
      showSection(adminGatekeeperSection);
      navBar.classList.remove('hidden');
      isAdmin = false;
    }
  }

  attendConfirmationDoneButton.onclick = function () {
     // cleanup confirmation page
    attendConfirmationDetails.innerHTML = '';
    showSection(partiesSectionAttendees);
  }

  partiesAttendeeViewMenuButton.onclick = function() {
    showSection(partiesSectionAttendees, partiesAttendeeViewMenuButton);
  };
  partiesAttendeeViewMenuButton.onclick();
}, false);
