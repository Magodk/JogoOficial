// ==========================================================
// 1. IMPORTAÇÕES E CONFIGURAÇÕES DO FIREBASE
// ==========================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAoHz8j6blx7nQTVxUyOOQ_Mg4MMF2ThGg",
  authDomain: "meu-jogo-online-880e0.firebaseapp.com",
  projectId: "meu-jogo-online-880e0",
  storageBucket: "meu-jogo-online-880e0.firebasestorage.app",
  messagingSenderId: "604190129868",
  appId: "1:604190129868:web:4c45c49f5bd1b3c0718c69",
  measurementId: "G-QM9QYRFX8T"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Novos Elementos HTML do Login
const loginPanel = document.getElementById("login-panel");
const gameArea = document.getElementById("game-area");
const usernameInput = document.getElementById("username-input");
const passwordInput = document.getElementById("password-input");
const loginButton = document.getElementById("login-button");
const registerButton = document.getElementById("register-button");
const message = document.getElementById("message");
const logoutButton = document.getElementById("logout-button");
const rememberMeCheckbox = document.getElementById("remember-me");

// Resto dos Elementos HTML
const conveyorBelt = document.getElementById("conveyor-belt");
const inventoryButton = document.getElementById("inventory-button");
const inventoryContainer = document.getElementById("inventory-container");
const closeInventoryButton = document.getElementById("close-inventory");
const inventoryItems = document.getElementById("inventory-items");
const capacityFill = document.getElementById("capacity-fill");
const totalItemsDisplay = document.getElementById("total-items");
const maxCapacityDisplay = document.getElementById("max-capacity");
const scoreDisplay = document.getElementById("score");
const expandButton = document.getElementById("expand-capacity");

// Elementos do placar e ID
const usernameDisplay = document.getElementById("username-display");
const accountIdDisplay = document.getElementById("account-id-display");

// Modal de compra
const purchaseModal = document.getElementById("treasure-purchase-modal");
const closePurchaseButton = document.getElementById("close-purchase-button");
const purchaseImg = document.getElementById("purchase-img");
const purchaseName = document.getElementById("purchase-name");
const purchaseValue = document.getElementById("purchase-value");
const purchaseAuria = document.getElementById("purchase-auria");
const buyButton = document.getElementById("buy-button");

// Modal de informações do inventário
const infoModal = document.createElement("div");
infoModal.classList.add("modal-overlay");
infoModal.innerHTML = `
    <div class="modal-content">
        <button id="close-info-button" class="close-modal-button">X</button>
        <img id="info-img" src="" alt="Imagem do Tesouro">
        <h3 id="info-name"></h3>
        <p><strong>Quantidade:</strong> <span id="info-quantity"></span></p>
        <p><strong>Produção por segundo:</strong> <span id="info-auria"></span></p>
        <p><strong>Preço de venda:</strong> <span id="info-value"></span></p>
        <button id="sell-button">Vender 1</button>
    </div>`;
document.body.appendChild(infoModal);

// Elementos dentro do infoModal
const closeInfoButton = infoModal.querySelector("#close-info-button");
const infoImg = infoModal.querySelector("#info-img");
const infoName = infoModal.querySelector("#info-name");
const infoQuantity = infoModal.querySelector("#info-quantity");
const infoAuria = infoModal.querySelector("#info-auria");
const infoValue = infoModal.querySelector("#info-value");
const sellButton = infoModal.querySelector("#sell-button");

// Variáveis do jogo
let score = 100;
let inventory = {};
let capacity = 20;
let totalItems = 0;
let expandCost = 100;

// Variáveis para o novo modo de visualização
let isViewingOtherPlayer = false;
let savedAdminState = {};

// Tesouros com raridade
const treasures = [
    { name: "Saco de Moedas", value: 3, auria: 0.1, img: "https://i.imgur.com/Dktretb.png", rarity: "common", chance: 45 },
    { name: "Moeda de Cobre", value: 5, auria: 0.2, img: "https://i.imgur.com/Rf3OAK6.png", rarity: "common", chance: 44 },
    { name: "Pérola Simples", value: 12, auria: 0.3, img: "https://i.imgur.com/FWmR3eM.png", rarity: "common", chance: 40 },
    { name: "Moeda de Ouro", value: 12, auria: 0.4, img: "https://i.imgur.com/1kweEds.png", rarity: "rare", chance: 30 },
    { name: "Pérola Rara", value: 20, auria: 0.7, img: "https://i.imgur.com/2ddcqrF.png", rarity: "epic", chance: 15 },
    { name: "Rubi Lendário", value: 35, auria: 1.5, img: "https://i.imgur.com/pYpdqiy.png", rarity: "legendary", chance: 5 }
];

// Variáveis de tempo para o game loop
let lastFrameTime = 0;
let treasureSpawnTimer = 0;
let auriaTimer = 0;
const TREASURE_SPAWN_INTERVAL = 3000;
const AURIA_GEN_INTERVAL = 1000;

// ----- NOVO PAINEL DE ADMINISTRAÇÃO -----
const newAdminPanel = document.getElementById("new-admin-panel");
const closeAdminPanelButton = document.getElementById("close-admin-panel");
const playerListContainer = document.getElementById("player-list");
const playerDetailsPanel = document.getElementById("player-details-panel");
const playerDetailsName = document.getElementById("player-details-name");
const playerDetailsId = document.getElementById("player-details-id");
const playerDetailsScore = document.getElementById("player-details-score");
const adminInventoryItems = document.getElementById("admin-inventory-items");
const adminFeedbackMessage = document.getElementById("admin-feedback-message");
const refreshPlayerListButton = document.getElementById("refresh-player-list");

let selectedPlayerId = null;
let selectedPlayerUsername = null;

const openAdminPanelButton = document.createElement("button");
openAdminPanelButton.textContent = "Admin";
openAdminPanelButton.classList.add("admin-button");

openAdminPanelButton.addEventListener("click", () => {
    newAdminPanel.classList.remove("hidden");
    populatePlayerList();
});

closeAdminPanelButton.addEventListener("click", () => {
    newAdminPanel.classList.add("hidden");
    playerDetailsPanel.classList.add("hidden");
    adminFeedbackMessage.textContent = "";
});

refreshPlayerListButton.addEventListener("click", populatePlayerList);

function populateTreasureSelect() {
    const giveTreasureSelect = document.getElementById("give-treasure-select");
    if (giveTreasureSelect) {
        giveTreasureSelect.innerHTML = "";
        treasures.forEach(t => {
            const option = document.createElement("option");
            option.value = t.name;
            option.textContent = t.name;
            giveTreasureSelect.appendChild(option);
        });
    }
}

async function populatePlayerList() {
    playerListContainer.innerHTML = "";
    const querySnapshot = await getDocs(collection(db, "users"));
    
    querySnapshot.forEach((doc) => {
        const userData = doc.data();
        const playerItem = document.createElement("div");
        playerItem.classList.add("player-list-item");
        
        const playerNameSpan = document.createElement("span");
        playerNameSpan.textContent = userData.username;
        playerItem.appendChild(playerNameSpan);

        const statusIndicator = document.createElement("div");
        statusIndicator.classList.add("online-status", userData.isOnline ? "online" : "offline");
        playerNameSpan.textContent += ` (${userData.isOnline ? "Online" : "Offline"})`;
        playerItem.appendChild(statusIndicator);

        playerItem.dataset.id = userData.id;
        playerItem.dataset.username = userData.username;
        playerItem.addEventListener("click", () => {
            selectPlayer(userData.id, userData.username);
        });
        playerListContainer.appendChild(playerItem);
    });
}

async function selectPlayer(accountId, username) {
    selectedPlayerId = accountId;
    selectedPlayerUsername = username;
    const docRef = doc(db, "users", accountId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        adminFeedbackMessage.textContent = "Erro: Jogador não encontrado no banco de dados.";
        return;
    }
    
    const userData = docSnap.data();
    
    playerDetailsName.textContent = selectedPlayerUsername;
    playerDetailsId.textContent = userData.id;
    playerDetailsScore.textContent = Math.floor(userData.score);
    
    playerDetailsPanel.classList.remove("hidden");
    adminFeedbackMessage.textContent = "";

    document.querySelectorAll(".player-list-item").forEach(item => {
        item.classList.remove("selected");
        if (item.dataset.id === accountId) {
            item.classList.add("selected");
        }
    });

    const adminCommandSection = document.querySelector("#player-details-panel .admin-command-section");
    adminCommandSection.innerHTML = `
        <h3 class="admin-panel-subtitle">Dar Moedas:</h3>
        <div class="admin-action-wrapper">
            <input type="number" id="give-coins-input" placeholder="Quant. de moedas">
            <button id="give-coins-button" class="admin-action-button">Dar Moedas</button>
        </div>
        <h3 class="admin-panel-subtitle">Dar Tesouro:</h3>
        <div class="admin-action-wrapper">
            <select id="give-treasure-select"></select>
            <button id="give-treasure-button" class="admin-action-button">Dar Tesouro</button>
        </div>
        <h3 class="admin-panel-subtitle">Ações de Conta:</h3>
        <div class="admin-action-wrapper">
            <button id="delete-account-button" class="admin-action-button delete-account-button">Excluir Conta Permanentemente</button>
            <button id="add-admin-button" class="admin-action-button add-admin-button">Adicionar Admin</button>
            <button id="remove-admin-button" class="admin-action-button remove-admin-button">Remover Admin</button>
        </div>
        <h3 class="admin-panel-subtitle">Outras Ações:</h3>
        <div class="admin-action-wrapper">
            <label for="increase-capacity-input">Aumentar Capacidade:</label>
            <input type="number" id="increase-capacity-input" placeholder="Aumentar em (ex: 10)">
            <button id="increase-capacity-button" class="admin-action-button">Aumentar</button>
        </div>
    `;

    populateTreasureSelect();

    document.getElementById("give-coins-button").addEventListener("click", handleGiveCoins);
    document.getElementById("give-treasure-button").addEventListener("click", handleGiveTreasure);
    document.getElementById("delete-account-button").onclick = handleDeleteAccount;
    document.getElementById("add-admin-button").onclick = handleAddAdmin;
    document.getElementById("remove-admin-button").onclick = handleRemoveAdmin;
    document.getElementById("increase-capacity-button").onclick = handleIncreaseCapacity;
    
    updateAdminInventoryUI(userData.inventory || {});
}

async function handleDeleteAccount() {
    if (selectedPlayerId === auth.currentUser.uid) {
        adminFeedbackMessage.textContent = "Não é possível excluir a sua própria conta.";
        return;
    }

    if (confirm(`Tem certeza que deseja excluir a conta de ${selectedPlayerUsername} (${selectedPlayerId})? Esta ação é irreversível.`)) {
        const docRef = doc(db, "users", selectedPlayerId);
        await deleteDoc(docRef);
        adminFeedbackMessage.textContent = `A conta de ${selectedPlayerUsername} foi excluída permanentemente.`;
        playerDetailsPanel.classList.add("hidden");
        populatePlayerList();
    }
}

async function handleAddAdmin() {
    const docRef = doc(db, "users", selectedPlayerId);
    await updateDoc(docRef, { isAdmin: true });
    adminFeedbackMessage.textContent = `${selectedPlayerUsername} agora é um administrador.`;
}

async function handleRemoveAdmin() {
    if (selectedPlayerId === auth.currentUser.uid) {
        adminFeedbackMessage.textContent = "Não é possível remover seu próprio status de administrador.";
        return;
    }
    const docRef = doc(db, "users", selectedPlayerId);
    await updateDoc(docRef, { isAdmin: false });
    adminFeedbackMessage.textContent = `${selectedPlayerUsername} não é mais um administrador.`;
}

function updateAdminInventoryUI(inventoryData) {
    const adminInventoryItems = document.getElementById("admin-inventory-items");
    if (!adminInventoryItems) return;
    
    adminInventoryItems.innerHTML = "";
    if (Object.values(inventoryData).length === 0) {
        adminInventoryItems.textContent = "Inventário Vazio";
    } else {
        Object.values(inventoryData).forEach(item => {
            const div = document.createElement("div");
            div.classList.add("inventory-item", item.rarity);
            div.innerHTML = `<img src="${item.img}" alt="${item.name}">
                                 <span class="item-quantity">${item.quantity}</span>`;
            adminInventoryItems.appendChild(div);
        });
    }
}

async function handleGiveCoins() {
    if (!selectedPlayerId) {
        adminFeedbackMessage.textContent = "Nenhum jogador selecionado.";
        return;
    }
    const giveCoinsInput = document.getElementById("give-coins-input");
    const value = parseInt(giveCoinsInput.value);
    if (isNaN(value) || value <= 0) {
        adminFeedbackMessage.textContent = "Por favor, insira uma quantidade válida.";
        return;
    }

    const docRef = doc(db, "users", selectedPlayerId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const currentScore = docSnap.data().score || 0;
        const newScore = currentScore + value;
        await updateDoc(docRef, { score: newScore });
        playerDetailsScore.textContent = Math.floor(newScore);
        adminFeedbackMessage.textContent = `${value} moedas adicionadas para ${selectedPlayerUsername}.`;
    } else {
        adminFeedbackMessage.textContent = "Erro: Jogador não encontrado.";
    }
}

async function handleGiveTreasure() {
    if (!selectedPlayerId) {
        adminFeedbackMessage.textContent = "Nenhum jogador selecionado.";
        return;
    }
    const giveTreasureSelect = document.getElementById("give-treasure-select");
    const treasureName = giveTreasureSelect.value;
    const treasureToGive = treasures.find(t => t.name === treasureName);

    if (!treasureToGive) return;

    const docRef = doc(db, "users", selectedPlayerId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const userData = docSnap.data();
        const userInventory = userData.inventory || {};
        if (!userInventory[treasureName]) {
            userInventory[treasureName] = { ...treasureToGive, quantity: 0 };
        }
        userInventory[treasureName].quantity++;
        userData.totalItems = (userData.totalItems || 0) + 1;
        
        await updateDoc(docRef, {
            inventory: userInventory,
            totalItems: userData.totalItems
        });
        updateAdminInventoryUI(userInventory);
        adminFeedbackMessage.textContent = `${treasureToGive.name} adicionado ao inventário de ${selectedPlayerUsername}.`;
    } else {
        adminFeedbackMessage.textContent = "Erro: Jogador não encontrado.";
    }
}

async function handleIncreaseCapacity() {
    if (!selectedPlayerId) {
        adminFeedbackMessage.textContent = "Nenhum jogador selecionado.";
        return;
    }
    const increaseCapacityInput = document.getElementById("increase-capacity-input");
    const value = parseInt(increaseCapacityInput.value);
    if (isNaN(value) || value <= 0) {
        adminFeedbackMessage.textContent = "Por favor, insira uma quantidade válida.";
        return;
    }
    const docRef = doc(db, "users", selectedPlayerId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const currentCapacity = docSnap.data().capacity || 0;
        const newCapacity = currentCapacity + value;
        await updateDoc(docRef, { capacity: newCapacity });
        adminFeedbackMessage.textContent = `Capacidade do inventário de ${selectedPlayerUsername} aumentada em ${value}. Nova capacidade: ${newCapacity}.`;
    } else {
        adminFeedbackMessage.textContent = "Erro: Jogador não encontrado.";
    }
}

// Funções de Login e Salvar
async function saveGame() {
    const user = auth.currentUser;
    if (user) {
        const userData = {
            score: score,
            inventory: inventory,
            capacity: capacity,
            totalItems: totalItems,
            expandCost: expandCost,
            isOnline: true
        };
        try {
            await updateDoc(doc(db, "users", user.uid), userData);
        } catch (e) {
            console.error("Erro ao salvar o jogo:", e);
        }
    }
}

function loadGame(userData) {
    score = userData.score || 0;
    inventory = userData.inventory || {};
    capacity = userData.capacity || 20;
    totalItems = userData.totalItems || 0;
    expandCost = userData.expandCost || 100;
    
    usernameDisplay.textContent = userData.username;
    accountIdDisplay.textContent = userData.id;

    loginPanel.classList.add("hidden");
    gameArea.classList.remove("hidden");

    if (userData.isAdmin) {
        gameArea.appendChild(openAdminPanelButton);
    } else {
        if (openAdminPanelButton.parentNode) {
            openAdminPanelButton.parentNode.removeChild(openAdminPanelButton);
        }
    }

    updateInventoryUI();
    updateCapacityBar();
    message.textContent = "";

    if (lastFrameTime === 0) {
        requestAnimationFrame(gameLoop);
    }
}

loginButton.addEventListener("click", async () => {
    const username = usernameInput.value;
    const password = passwordInput.value;
    message.textContent = "";

    try {
        const userCredential = await signInWithEmailAndPassword(auth, username, password);
        const user = userCredential.user;
        await updateDoc(doc(db, "users", user.uid), { isOnline: true });
        
        // onAuthStateChanged irá cuidar do resto
    } catch (error) {
        console.error(error);
        message.textContent = "Erro no login: E-mail ou senha incorretos.";
    }
});

registerButton.addEventListener("click", async () => {
    const username = usernameInput.value;
    const password = passwordInput.value;
    message.textContent = "";

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, username, password);
        const user = userCredential.user;
        
        const initialData = {
            score: 100,
            inventory: {},
            capacity: 20,
            totalItems: 0,
            expandCost: 100,
            username: username,
            id: user.uid,
            isAdmin: (username === "dono2@test.com" && password === "acesso123"),
            isOnline: true
        };
        await setDoc(doc(db, "users", user.uid), initialData);

        message.textContent = "Conta criada com sucesso!";
        // onAuthStateChanged irá cuidar do resto
    } catch (error) {
        console.error(error);
        if (error.code === 'auth/email-already-in-use') {
            message.textContent = "Este e-mail já está em uso.";
        } else if (error.code === 'auth/weak-password') {
            message.textContent = "A senha deve ter pelo menos 6 caracteres.";
        } else {
            message.textContent = "Erro ao registrar. Tente novamente.";
        }
    }
});

logoutButton.addEventListener("click", async () => {
    const user = auth.currentUser;
    if (user) {
        await updateDoc(doc(db, "users", user.uid), { isOnline: false });
    }
    await signOut(auth);
    loginPanel.classList.remove("hidden");
    gameArea.classList.add("hidden");
    newAdminPanel.classList.add("hidden");
    if (openAdminPanelButton.parentNode) {
        openAdminPanelButton.parentNode.removeChild(openAdminPanelButton);
    }
    usernameInput.value = "";
    passwordInput.value = "";
});

// onAuthStateChanged: Observador do estado de autenticação
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            loadGame(docSnap.data());
        }
    } else {
        loginPanel.classList.remove("hidden");
        gameArea.classList.add("hidden");
    }
});

// Funções do jogo (sem mudanças significativas)
function getRandomTreasure() {
    const rand = Math.random() * 100;
    let sum = 0;
    for (let t of treasures) {
        sum += t.chance;
        if (rand <= sum) return t;
    }
    return treasures[0];
}

function createTreasure() {
    const treasureData = getRandomTreasure();
    const treasure = document.createElement("div");
    treasure.classList.add("treasure", treasureData.rarity);
    treasure.dataset.name = treasureData.name;
    treasure.dataset.value = treasureData.value;
    treasure.dataset.auria = treasureData.auria;
    treasure.dataset.img = treasureData.img;

    treasure.innerHTML = `<img src="${treasureData.img}" alt="${treasureData.name}">
                                 <div class="treasure-info">💰 ${treasureData.value} | ⚡ ${treasureData.auria}/s</div>`;
    conveyorBelt.appendChild(treasure);

    treasure.addEventListener("click", () => openPurchaseModal(treasure, treasureData));
}

function openPurchaseModal(treasureElement, treasureData) {
    purchaseImg.src = treasureData.img;
    purchaseName.textContent = treasureData.name;
    purchaseValue.textContent = treasureData.value;
    purchaseAuria.textContent = treasureData.auria;

    buyButton.onclick = () => {
        purchaseModal.classList.remove("open");
        buyTreasureWithAnimation(treasureElement, treasureData);
    };

    purchaseModal.classList.add("open");
}

async function buyTreasureWithAnimation(treasureElement, treasureData) {
    if (totalItems >= capacity) { alert("Inventário cheio!"); return; }
    if (score < treasureData.value) { alert("Moedas insuficientes!"); return; }

    score -= treasureData.value;

    if (!inventory[treasureData.name]) {
        inventory[treasureData.name] = { ...treasureData, quantity: 0 };
    }
    inventory[treasureData.name].quantity++;
    totalItems++;

    await saveGame();

    const treasureRect = treasureElement.getBoundingClientRect();
    const inventoryRect = inventoryButton.getBoundingClientRect();
    treasureElement.style.position = "fixed";
    treasureElement.style.left = treasureRect.left + "px";
    treasureElement.style.top = treasureRect.top + "px";
    treasureElement.style.width = treasureRect.width + "px";
    treasureElement.style.height = treasureRect.height + "px";
    treasureElement.style.transition = "all 1s ease-in-out";
    document.body.appendChild(treasureElement);

    const targetX = inventoryRect.left + inventoryRect.width / 2 - treasureRect.width / 2;
    const targetY = inventoryRect.top + inventoryRect.height / 2 - treasureRect.height / 2;

    requestAnimationFrame(() => {
        treasureElement.style.left = targetX + "px";
        treasureElement.style.top = targetY + "px";
        treasureElement.style.width = "30px";
        treasureElement.style.height = "30px";
        treasureElement.style.opacity = "0";
    });

    setTimeout(() => treasureElement.remove(), 1000);
}

function updateInventoryUI() {
    inventoryItems.innerHTML = "";
    Object.values(inventory).forEach(item => {
        const div = document.createElement("div");
        div.classList.add("inventory-item", item.rarity);
        div.innerHTML = `<img src="${item.img}" alt="${item.name}">
                                 <span class="item-quantity">${item.quantity}</span>`;
        if (isViewingOtherPlayer) {
            div.style.cursor = "default";
            div.onclick = null;
        } else {
            div.addEventListener("click", () => openInfoModal(item));
        }
        inventoryItems.appendChild(div);
    });

    if (isViewingOtherPlayer) {
        expandButton.style.display = "none";
        logoutButton.style.display = "none";

        let backButton = document.getElementById("back-button");
        if (!backButton) {
            backButton = document.createElement("button");
            backButton.id = "back-button";
            backButton.classList.add("button", "logout-button");
            backButton.textContent = "Voltar ao meu inventário";
            backButton.onclick = exitViewMode;
            inventoryContainer.appendChild(backButton);
        }
        
        document.querySelector("#inventory-container .inventory-header h2").textContent = "Inventário (Visualização)";
        document.querySelector("#inventory-container p.score-display").textContent = "Moedas: " + Math.floor(score);
        document.querySelector("#inventory-container p.username-display").textContent = "Usuário: " + usernameDisplay.textContent;
        document.querySelector("#inventory-container p.account-id").textContent = "ID da Conta: " + accountIdDisplay.textContent;

    } else {
        expandButton.style.display = "block";
        logoutButton.style.display = "block";
        const backButton = document.getElementById("back-button");
        if (backButton) backButton.remove();

        document.querySelector("#inventory-container .inventory-header h2").textContent = "Inventário";
        document.querySelector("#inventory-container p.score-display").textContent = `Moedas: ${Math.floor(score)}`;
        document.querySelector("#inventory-container p.username-display").textContent = `Usuário: ${usernameInput.value}`;
        document.querySelector("#inventory-container p.account-id").textContent = `ID da Conta: ${accountIdDisplay.textContent}`;
    }
    
    scoreDisplay.textContent = Math.floor(score);
    totalItemsDisplay.textContent = totalItems;
    maxCapacityDisplay.textContent = capacity;
}

function openInfoModal(item) {
    if (isViewingOtherPlayer) return;

    infoImg.src = item.img;
    infoName.textContent = item.name;
    infoQuantity.textContent = item.quantity;
    infoAuria.textContent = item.auria;
    infoValue.textContent = item.value;
    sellButton.onclick = () => sellItem(item);
    infoModal.classList.add("open");
}

function exitViewMode() {
    if (auth.currentUser) {
        // Recarrega os dados do usuário logado do Firebase
        const docRef = doc(db, "users", auth.currentUser.uid);
        getDoc(docRef).then(docSnap => {
            if (docSnap.exists()) {
                loadGame(docSnap.data());
                isViewingOtherPlayer = false;
                updateInventoryUI();
                updateCapacityBar();
                inventoryContainer.classList.remove("open");
            }
        });
    }
}

async function sellItem(item) {
    if (item.quantity <= 0) return;
    item.quantity--;
    totalItems--;
    score += item.value;
    if (item.quantity === 0) delete inventory[item.name];
    
    await saveGame();
    updateInventoryUI();
    updateCapacityBar();
    infoModal.classList.remove("open");
}

function updateCapacityBar() {
    const percent = (totalItems / capacity) * 100;
    capacityFill.style.width = percent + "%";
}

async function generateAuria() {
    let totalAuria = 0;
    Object.values(inventory).forEach(item => {
        totalAuria += item.quantity * item.auria;
    });
    score += totalAuria;
    await saveGame();
}

expandButton.addEventListener("click", async () => {
    if (score >= expandCost) {
        score -= expandCost;
        capacity += 10;
        expandCost += 50;
        expandButton.textContent = `Aumentar Capacidade (${expandCost} moedas)`;
        await saveGame();
        updateInventoryUI();
        updateCapacityBar();
    } else {
        alert("Moedas insuficientes!");
    }
});

// Eventos dos botões de mochila e modal
inventoryButton.addEventListener("click", () => inventoryContainer.classList.add("open"));
closeInventoryButton.addEventListener("click", () => {
    if (isViewingOtherPlayer) {
        exitViewMode();
    } else {
        inventoryContainer.classList.remove("open");
    }
});
closePurchaseButton.addEventListener("click", () => purchaseModal.classList.remove("open"));
closeInfoButton.addEventListener("click", () => infoModal.classList.remove("open"));

// Game Loop principal
function gameLoop(currentTime) {
    const deltaTime = currentTime - lastFrameTime;
    lastFrameTime = currentTime;

    treasureSpawnTimer += deltaTime;
    if (treasureSpawnTimer >= TREASURE_SPAWN_INTERVAL) {
        createTreasure();
        treasureSpawnTimer = 0;
    }

    auriaTimer += deltaTime;
    if (auriaTimer >= AURIA_GEN_INTERVAL) {
        generateAuria();
        auriaTimer = 0;
    }

    document.querySelectorAll('.treasure').forEach(treasure => {
        const currentTop = parseFloat(treasure.style.top || -60);
        treasure.style.top = `${currentTop + (deltaTime * 0.05)}px`;
        if (parseFloat(treasure.style.top) > conveyorBelt.offsetHeight) {
            treasure.remove();
        }
    });

    requestAnimationFrame(gameLoop);
}

// CORREÇÃO: Listener para o evento 'storage' para atualizar em tempo real
// ESTE LISTENER NÃO É MAIS NECESSÁRIO COM FIREBASE
// O Firebase lida com a sincronização de dados automaticamente
// window.addEventListener('storage', (event) => { ... });