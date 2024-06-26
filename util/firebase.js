
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, GoogleAuthProvider ,signInWithPopup } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCBH0sICNsYQL6ULvGEQoNlwAaab8P6l-s",
  authDomain: "nothing-ba929.firebaseapp.com",
  projectId: "nothing-ba929",
  storageBucket: "nothing-ba929.appspot.com",
  messagingSenderId: "992730833242",
  appId: "1:992730833242:web:58d5bf94501d1125715363",
  measurementId: "G-ZT87557R84"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app)
auth.languageCode = 'en'

const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  prompt: 'select_account'
});


const googleLogin = document.getElementById("google-login-btn");
googleLogin.addEventListener("click", async function () { 

  try {
    const result = await signInWithPopup(auth, provider);

    window.location.href = '/';

  } catch (error) {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.error("Authentication failed:", errorCode, errorMessage);
  }
});


function showSignInSuccessMessage() {
  Swal.fire({
    icon: 'success',
    title: 'Sign-in Successful!',
    text: 'Welcome to our homepage!',
    showConfirmButton: false,
    timer: 2000 
  });
}

function redirectToHomePage() {
  window.location.href = '/';
}
