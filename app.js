
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import {
  getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, where
} from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';

import { jsPDF } from "https://cdn.skypack.dev/jspdf";

const firebaseConfig = {
  apiKey: "AIzaSyCqOK8dAsYVd3G5kv6rFbrkDfLhmgFOXAU",
  authDomain: "flight-scheduler-3daea.firebaseapp.com",
  projectId: "flight-scheduler-3daea",
  storageBucket: "flight-scheduler-3daea.appspot.com",
  messagingSenderId: "1036581965112",
  appId: "1:1036581965112:web:0bd21e436764ea4294c5cd",
  measurementId: "G-ZC0843FNX8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const adminEmail = "AhmedalTalqani@gmail.com";

onAuthStateChanged(auth, (user) => {
  if (user) {
    loadFlightApp();
  } else {
    showLoginForm();
  }
});

function showLoginForm() {
  document.getElementById('app').innerHTML = `
    <h2>تسجيل الدخول</h2>
    <input id="email" placeholder="البريد الإلكتروني"><br>
    <input id="password" type="password" placeholder="كلمة المرور"><br>
    <button onclick="login()">دخول</button>
    <div id="output"></div>
  `;
}

window.login = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
    document.getElementById("output").innerHTML = "<b>تم تسجيل الدخول</b>";
  } catch {
    document.getElementById("output").innerText = "فشل تسجيل الدخول";
  }
};

window.logout = async function () {
  await signOut(auth);
  showLoginForm();
};

function loadFlightApp() {
  const user = auth.currentUser;
  const isAdmin = user && user.email === adminEmail;

  document.getElementById("app").innerHTML = `
    <button onclick="logout()">🔓 تسجيل الخروج</button>
    <h2>عرض الرحلات</h2>
    <input id="filterName" placeholder="فلترة حسب الاسم" oninput="loadFlights()"><br>
    <div id="flightsTable"></div>
  `;
  loadFlights();
}

window.loadFlights = async function () {
  const nameFilter = document.getElementById("filterName").value.trim();
  const q = nameFilter ? query(collection(db, "flights"), where("name", "==", nameFilter)) : collection(db, "flights");
  const snapshot = await getDocs(q);
  let html = "<table><tr><th>الاسم</th><th>رقم الرحلة</th><th>التاريخ</th><th>🗑️</th><th>📤</th></tr>";
  snapshot.forEach(docSnap => {
    const d = docSnap.data();
    const rowId = docSnap.id;
    html += `<tr>
      <td>${d.name || ""}</td>
      <td>${d.fltno || ""}</td>
      <td>${d.date || ""}</td>
      <td><button onclick="deleteFlight('${rowId}')">🗑️</button></td>
      <td><button onclick="exportSinglePDF(${JSON.stringify(d)})">📤</button></td>
    </tr>`;
  });
  html += "</table>";
  document.getElementById("flightsTable").innerHTML = html;
};

window.deleteFlight = async function (id) {
  if (confirm("هل أنت متأكد من حذف الرحلة؟")) {
    await deleteDoc(doc(db, "flights", id));
    loadFlights();
  }
};

window.exportSinglePDF = function (data) {
  const doc = new jsPDF();
  const content = `
    الاسم: ${data.name || ""}
    رقم الرحلة: ${data.fltno || ""}
    التاريخ: ${data.date || ""}
    الملاحظات: ${data.notes || ""}
  `;
  doc.text(content, 10, 10);
  doc.save(`رحلة_${data.fltno || "بدون_رقم"}.pdf`);
};
