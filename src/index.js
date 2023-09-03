let submissionForm = {
  'group-name': '',
  'team-members': [],
  'project-name': '',
  'github-link': '',
  'group-password': '',
  'image-link': '',
  'is-website': false,
}

const mainMenuDiv = document.querySelector(".logged-out");
const loggedInMenuDiv = document.querySelector(".logged-in-menu");

function goToLoggedInMenu() {
  mainMenuDiv.style.display = 'none';
  loggedInMenuDiv.style.display = 'flex';
}

function goToMainMenu() {
  mainMenuDiv.style.display = 'flex';
  loggedInMenuDiv.style.display = 'none';
}
goToMainMenu();

/* -------------------------------------------------- firebase section ---------------------------------------------------------- */
let email, username;

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

function admin () {
  if (username == "admin") {
    return true;
  } 
  return false;
}

const loginForm = document.querySelector('.signup-login')
loginForm.addEventListener('submit', (e) => {
  e.preventDefault()

  const email = loginForm.email.value
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
async function sendChatMessage(message, username, gameID) {
  const chatID = push(ref(dr, `${gameID}/chat`)).key;
  const chatData = {
    message: message,
    timestamp: Date.now(),
    username: username,
  };
  await set(ref(dr, `${gameID}/chat/${chatID}`), chatData);
}

function listenForNewMessages(gameID, callback) {
  const chatRef = ref(dr, `${gameID}/chat`);
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
      messageElement.textContent = `${messageData.username}: ${messageData.message}`;
      chatMessages.appendChild(messageElement);
    }
  });

  const chatInput = document.getElementById("chatInput");
  const sendButton = document.getElementById("sendButton");

  sendButton.addEventListener("click", () => {
    const message = chatInput.value;
    if (message) {
      sendChatMessage(message, username, getMatchRef());
      chatInput.value = "";
    }
  });
}

//-------------------- firebase file storage -----------------------

const storage = getStorage(app);