import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

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
const auth = getAuth(app);
auth.languageCode = 'en';

const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  prompt: 'select_account'
});

const googleLogin = document.getElementById("google-login-btn");
googleLogin.addEventListener('click', function() {
  signInWithPopup(auth, provider)
    .then((result) => {
      const user = result.user;

      fetch('/api/google-authentication', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: user.displayName,
          email: user.email
        })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          window.location.href = '/';
        } else {
          Swal.fire({
            title: 'Error!',
            text: data.message,
            icon: 'error',
            confirmButtonText: 'OK'
          });
        }
      });

    }).catch((error) => {
      console.error("Authentication failed:", error.code, error.message);
    });
});
