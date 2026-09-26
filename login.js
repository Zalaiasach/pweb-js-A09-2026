if (localStorage.getItem("firstName")) {
  window.location.replace("index.html");
}

const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const btnLogin = document.getElementById("btnLogin");
const btnText = btnLogin.querySelector(".btn-text");
const loader = btnLogin.querySelector(".loader");
const alertBox = document.getElementById("alertBox");

function showAlert(message) {
  alertBox.textContent = message;
  alertBox.className = "alert-box alert-error";
  alertBox.classList.remove("hidden");
}

function clearAlert() {
  alertBox.textContent = "";
  alertBox.classList.add("hidden");
}

function setLoading(isLoading) {
  if (isLoading) {
    btnLogin.disabled = true;
    btnText.classList.add("hidden");
    loader.classList.remove("hidden");
  } else {
    btnLogin.disabled = false;
    btnText.classList.remove("hidden");
    loader.classList.add("hidden");
  }
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearAlert();

  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (!username || !password) {
    showAlert("Invalid");
    return;
  }

  setLoading(true);

  try {
    const response = await fetch("https://dummyjson.com/users?limit=0");
    if (!response.ok) {
      throw new Error(`Gagal memuat API Pengguna (Status: ${response.status})`);
    }

    const data = await response.json();
    const matchedUser = data.users.find(
      (u) => u.username === username && u.password === password
    );

    if (matchedUser) {
      localStorage.setItem("firstName", matchedUser.firstName);
      window.location.href = "index.html";
    } else {
      showAlert("Username atau password salah. Silakan coba lagi.");
    }
  } catch (error) {
    showAlert("Terjadi gangguan koneksi: " + error.message);
  } finally {
    setLoading(false);
  }
});