let projectSubmission = {
  "name": '',
  "contributers": [],
  "githubLink": "",
  "imagePath": "",
  "websiteLink": "none",
}

const mainMenuDiv = document.querySelector(".logged-out");
const loggedInMenuDiv = document.querySelector(".logged-in-menu");
const submissionMenuDiv = document.querySelector(".submission-menu");

function goToLoggedInMenu() {
  mainMenuDiv.style.display = 'none';
  loggedInMenuDiv.style.display = 'flex';
}

function goToSubmissionMenu() {
  submissionMenuDiv.style.display = 'flex';
  loggedInMenuDiv.style.display = 'none';
}

function goToMainMenu() {
  submissionMenuDiv.style.display = 'none';
  mainMenuDiv.style.display = 'flex';
  loggedInMenuDiv.style.display = 'none';
  console.log();
}
goToMainMenu();

function convertTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'numeric' });
}

/* -------------------------------------------------- firebase section ---------------------------------------------------------- */
let email, username, projectAccessRef;
let projectAccessList = [];

const firebaseConfig = {
  apiKey: "AIzaSyAR0CP4-z-kYWlvY-iLaTbaCrfn8QGIyqY",
  authDomain: "benet-coding-club.firebaseapp.com",
  projectId: "benet-coding-club",
  storageBucket: "benet-coding-club.appspot.com",
  messagingSenderId: "545186253378",
  appId: "1:545186253378:web:4a24a2ea92461e58a37bdb",
  measurementId: "G-F9LY9HPN88"
};

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
} from "firebase/firestore";
import { 
  getDatabase,
  ref, 
  onValue, 
  set,
  get,
  push
} from "firebase/database";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { 
  getStorage,
} from "firebase/storage";

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const dr = getDatabase();
const auth = getAuth();
let userId;

const signupForm = document.querySelector('.signup-login')
signupForm.addEventListener('submit', (e) => {
  e.preventDefault()

  email = signupForm.email.value
  const password = signupForm.password.value
  username = email.split('@')[0];
  createUserWithEmailAndPassword(auth, email, password)
    .then(cred => {
      signupForm.reset()
      userId = cred.user.uid;
      goToLoggedInMenu();
      initChat();
    })
    .catch(err => {
      console.log(err.message)
    })
  
})

// logging in and out
const logoutButton = document.querySelector('.logout')
logoutButton.addEventListener('click', () => {
  signOut(auth)
    .then(() => {
      console.log('user signed out')
      goToMainMenu();
      if (localStorage.getItem("savedEmail") != null && localStorage.getItem("savedPassword") != null && localStorage.getItem("savedUsername") != null) {
        document.querySelector(".email-input").value = localStorage.getItem("savedEmail");
        document.querySelector(".password-input").value = localStorage.getItem("savedPassword");
        document.querySelector(".username-input").value = localStorage.getItem("savedUsername");
      }
    })
    .catch(err => {
      console.log(err.message)
    })
})

const submissionMenuButton = document.querySelector(".add");
submissionMenuButton.addEventListener('click', () => {
  goToSubmissionMenu();
})

function admin () {
  if (username == "admin") {
    return true;
  } 
  return false;
}

const loginForm = document.querySelector('.signup-login')
loginForm.addEventListener('submit', (e) => {
  e.preventDefault()

  email = loginForm.email.value
  username = email.split('@')[0];
  const password = loginForm.password.value

  if (rememberMe) {
    localStorage.setItem("savedEmail", email);
    localStorage.setItem("savedPassword", password);
  } else {
    localStorage.removeItem("savedEmail");
    localStorage.removeItem("savedPassword");
  }
  
  signInWithEmailAndPassword(auth, email, password)
    .then(cred => {
      loginForm.reset()
      userId = cred.user.uid;
      goToLoggedInMenu();
      initChat();
    })
    .catch(err => {
      console.log(err.message)
    })
})

let rememberMe = true;
document.querySelector('.control-checkbox').checked = false;
var controlElement = document.querySelector('.control-checkbox');
var inputElement = controlElement.querySelector('.remember-me-check');
controlElement.addEventListener('click', function() {
    if (inputElement.checked) {
      rememberMe = true;
    } else {
      rememberMe = false;
    }
});

if (localStorage.getItem("savedEmail") != null && localStorage.getItem("savedPassword") != null) {
  document.querySelector(".email-input").value = localStorage.getItem("savedEmail");
  document.querySelector(".password-input").value = localStorage.getItem("savedPassword");
}

// ingame messaging
async function sendChatMessage(message, username) {
  const chatID = push(ref(dr, `chat`)).key;
  const chatData = {
    message: message,
    timestamp: Date.now(),
    username: username,
  };
  await set(ref(dr, `chat/${chatID}`), chatData);
}

function listenForNewMessages(gameID, callback) {
  const chatRef = ref(dr, `chat`);
  onValue(chatRef, (snapshot) => {
    const messages = snapshot.val();
    callback(messages);
  });
}

function initChat() {
  listenForNewMessages("chat", (messages) => {
    const chatMessages = document.getElementById("chatMessages");
    chatMessages.innerHTML = "";

    for (const messageKey in messages) {
      const messageData = messages[messageKey];
      const messageElement = document.createElement("div");
      messageElement.innerHTML = `<span style="color: red"> <span style="font-size: 0.4em">(${convertTimestamp(messageData.timestamp)})</span> ${messageData.username}</span>: ${messageData.message}`;
      chatMessages.appendChild(messageElement);
    }
  });

  const chatInput = document.getElementById("chatInput");
  const sendButton = document.getElementById("sendButton");

  sendButton.addEventListener("click", () => {
    const message = chatInput.value;
    if (message) {
      sendChatMessage(message, username);
      chatInput.value = "";
    }
  });
}

//-------------------- firebase file storage -----------------------

const submitProjectButton = document.querySelector(".submit-project-button");
submitProjectButton.addEventListener("click", () => {
  console.log("submitting project...");
  let projectName, githubLink, websiteLink = "none";
  let teamMember1, teamMember2, teamMember3 = "admin";

  const projectNameInput = document.getElementById("projectName").value;
  if (projectNameInput != "") {
    projectName = projectNameInput;
  } else {
    alert("project name must be enetered")
    return;
  }

  const teamMember1Input = document.getElementById("teamMember1").value;
  if (teamMember1Input != "") {
    teamMember1 = teamMember1Input;
  } else {
    alert("team member 1 name must be enetered")
    return;
  }

  const teamMember2Input = document.getElementById("teamMember2").value;
  if (teamMember2Input != "") {
    teamMember2 = teamMember2Input;
  }

  const teamMember3Input = document.getElementById("teamMember3").value;
  if (teamMember3Input != "") {
    teamMember3 = teamMember3Input;
  }

  const githubLinkInput = document.getElementById("githubLink").value;
  if (githubLinkInput !== "") {
    if (githubLinkInput.startsWith("https://github.com/")) {
      githubLink = githubLinkInput;
    } else {
      alert("The GitHub link must start with 'https://github.com/'");
      return;
    }
  } else {
    alert("GitHub link must be entered");
    return;
  }

  const websiteLinkInput = document.getElementById("websiteLink").value;
  if (websiteLinkInput != "") {
    websiteLink = websiteLinkInput;
  }

  for (let i = 0; i < 3; i++) {
    let projectAccessRef;
    if (i == 0) {
      projectAccessRef = `/projectAccess/${teamMember1}`
    } else if (i == 1) {
      projectAccessRef = `/projectAccess/${teamMember2}`
    } else {
      projectAccessRef = `/projectAccess/${teamMember3}`
    }
    console.log(projectAccessRef);
    get(ref(dr, projectAccessRef)).then(snapshot => {
      let projectAccessList = snapshot.exists() ? snapshot.val() : [];
      projectAccessList.push(projectName);
      return set(ref(dr, projectAccessRef), projectAccessList);
    }).catch(error => {
      console.error("Error getting/setting data: ", error);
    });
  }  

})

const storage = getStorage();