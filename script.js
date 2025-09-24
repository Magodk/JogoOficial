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

// ==========================================================
// 2. VARIÁVEIS E ELEMENTOS DO DOM
// ==========================================================
const loginPanel = document.getElementById("login-panel");
const gameArea = document.getElementById("game-area");
const usernameInput = document.getElementById("username-input");
const passwordInput = document.getElementById("password-input");
const loginButton = document.getElementById("login-button");
const registerButton = document.getElementById("register-button");
const message = document.getElementById("message");
const logoutButton = document.getElementById("logout-button");
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
const usernameDisplay = document.getElementById("username-display");
const accountIdDisplay = document.getElementById("account-id-display");
const purchaseModal = document.getElementById("treasure-purchase-modal");
const closePurchaseButton = document.getElementById("close-purchase-button");
const purchaseImg = document.getElementById("purchase-img");
const purchaseName = document.getElementById("purchase-name");
const purchaseValue = document.getElementById("purchase-value");
const purchaseAuria = document.getElementById("purchase-auria");
const buyButton = document.getElementById("buy-button");
const infoModal = document.createElement("div");
infoModal.classList.add("modal-overlay");
infoModal.innerHTML = `<div class="modal-content"><button id="close-info-button" class="close-modal-button">X</button><img id="info-img" src="" alt="Imagem do Tesouro"><h3 id="info-name"></h3><p><strong>Quantidade:</strong> <span id="info-quantity"></span></p><p><strong>Produção por segundo:</strong> <span id="info-auria"></span></p><p><strong>Preço de venda:</strong> <span id="info-value"></span></p><button id="sell-button">Vender 1</button></div>`;
document.body.appendChild(infoModal);
const closeInfoButton = infoModal.querySelector("#close-info-button");
const infoImg = infoModal.querySelector("#info-img");
const infoName = infoModal.querySelector("#info-name");
const infoQuantity = infoModal.querySelector("#info-quantity");
const infoAuria = infoModal.querySelector("#info-auria");
const infoValue = infoModal.querySelector("#info-value");
const sellButton = infoModal.querySelector("#sell-button");

let score = 100;
let inventory = {};
let capacity = 20;
let totalItems = 0;
let expandCost = 100;
let isViewingOtherPlayer = false;
let savedAdminState = {};

const treasures = [
    { name: "Saco de Moedas", value: 3, auria: 0.1, img: "https://i.imgur.com/Dktretb.png", rarity: "common", chance: 45 },
    { name: "Moeda de Cobre", value: 5, auria: 0.2, img: "https://i.imgur.com/Rf3OAK6.png", rarity: "common", chance: 44 },
    { name: "Pérola Simples", value: 12, auria: 0.3, img: "https://i.imgur.com/FWmR3eM.png", rarity: "common", chance: 40 },
    { name: "Moeda de Ouro", value: 12, auria: 0.4, img: "https://i.imgur.com/1kweEds.png", rarity: "rare", chance: 30 },
    { name: "Pérola Rara", value: 20, auria: 0.7, img: "https://i.imgur.com/2ddcqrF.png", rarity: "epic", chance: 15 },
    { name: "Rubi Lendário", value: 35, auria: 1.5, img: "https://i.imgur.com/pYpdqiy.png", rarity: "legendary", chance: 5 }
];

let lastFrameTime = 0;
let treasureSpawnTimer = 0;
let auriaTimer = 0;
const TREASURE_SPAWN_INTERVAL = 3000;
const AURIA_GEN_INTERVAL = 1000;
const MAX_DELTA = 1000;

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
const deleteAccountButton = document.createElement("button");
deleteAccountButton.textContent = "Excluir Conta Permanentemente";
deleteAccountButton.classList.add("admin-action-button", "delete-account-button");
const addAdminButton = document.createElement("button");
addAdminButton.textContent = "Adicionar Admin";
addAdminButton.classList.add("admin-action-button", "add-admin-button");
const removeAdminButton = document.createElement("button");
removeAdminButton.textContent = "Remover Admin";
removeAdminButton.classList.add("admin-action-button", "remove-admin-button");

let selectedPlayerId = null;
let selectedPlayerUsername = null;
let currentUserId = null;

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
    const playersCol = collection(db, "players");
    const playerSnapshot = await getDocs(playersCol);

    playerSnapshot.forEach(docSnap => {
        const userData = docSnap.data();
        const playerItem = document.createElement("div");
        playerItem.classList.add("player-list-item");

        const playerNameSpan = document.createElement("span");
        playerNameSpan.textContent = userData.username;
        playerItem.appendChild(playerNameSpan);

        playerItem.dataset.id = docSnap.id;
        playerItem.dataset.username = userData.username;
        playerItem.addEventListener("click", () => {
            selectPlayer(docSnap.id, userData.username);
        });
        playerListContainer.appendChild(playerItem);
    });
}

async function selectPlayer(accountId, username) {
    selectedPlayerId = accountId;
    selectedPlayerUsername = username;

    const docRef = doc(db, "players", accountId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        adminFeedbackMessage.textContent = "Erro: Jogador não encontrado.";
        return;
    }

    const targetUser = docSnap.data();
    playerDetailsName.textContent = selectedPlayerUsername;
    playerDetailsId.textContent = targetUser.accountId;
    playerDetailsScore.textContent = Math.floor(targetUser.score);

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
    document.getElementById("delete-account-button").onclick = handleDeleteAccount;
    document.getElementById("add-admin-button").onclick = handleAddAdmin;
    document.getElementById("remove-admin-button").onclick = handleRemoveAdmin;
    document.getElementById("increase-capacity-button").onclick = handleIncreaseCapacity;

    updateAdminInventoryUI(targetUser.inventory || {});
}

async function handleDeleteAccount() {
    if (selectedPlayerId === currentUserId) {
        adminFeedbackMessage.textContent = "Não é possível excluir a sua própria conta.";
        return;
    }
    if (confirm(`Tem certeza que deseja excluir a conta de ${selectedPlayerUsername}? Esta ação é irreversível.`)) {
        try {
            await deleteDoc(doc(db, "players", selectedPlayerId));
            adminFeedbackMessage.textContent = `A conta de ${selectedPlayerUsername} foi excluída permanentemente.`;
            playerDetailsPanel.classList.add("hidden");
            populatePlayerList();
        } catch (e) {
            console.error("Erro ao excluir conta:", e);
            adminFeedbackMessage.textContent = "Erro ao excluir conta.";
        }
    }
}

async function handleAddAdmin() {
    try {
        const docRef = doc(db, "players", selectedPlayerId);
        await updateDoc(docRef, { isAdmin: true });
        adminFeedbackMessage.textContent = `${selectedPlayerUsername} agora é um administrador.`;
    } catch (e) {
        console.error("Erro ao adicionar admin:", e);
        adminFeedbackMessage.textContent = "Erro ao adicionar admin.";
    }
}

async function handleRemoveAdmin() {
    try {
        if (selectedPlayerId === currentUserId) {
            adminFeedbackMessage.textContent = "Não é possível remover seu próprio status de administrador.";
            return;
        }
        const docRef = doc(db, "players", selectedPlayerId);
        await updateDoc(docRef, { isAdmin: false });
        adminFeedbackMessage.textContent = `${selectedPlayerUsername} não é mais um administrador.`;
    } catch (e) {
        console.error("Erro ao remover admin:", e);
        adminFeedbackMessage.textContent = "Erro ao remover admin.";
    }
}

function updateAdminInventoryUI(inventoryData) {
    const adminInventoryItemsEl = document.getElementById("admin-inventory-items");
    if (!adminInventoryItemsEl) return;
    adminInventoryItemsEl.innerHTML = "";
    if (!inventoryData || Object.values(inventoryData).length === 0) {
        adminInventoryItemsEl.textContent = "Inventário Vazio";
    } else {
        Object.values(inventoryData).forEach(item => {
            const div = document.createElement("div");
            div.classList.add("inventory-item", item.rarity);
            div.innerHTML = `<img src="${item.img}" alt="${item.name}"><span class="item-quantity">${item.quantity}</span>`;
            adminInventoryItemsEl.appendChild(div);
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
    try {
        const docRef = doc(db, "players", selectedPlayerId);
        const docSnap = await getDoc(docRef);
        const currentScore = (docSnap.exists() && docSnap.data().score) ? docSnap.data().score : 0;
        await updateDoc(docRef, { score: currentScore + value });
        playerDetailsScore.textContent = Math.floor(currentScore + value);
        adminFeedbackMessage.textContent = `${value} moedas adicionadas para ${selectedPlayerUsername}.`;
    } catch (e) {
        console.error("Erro ao dar moedas:", e);
        adminFeedbackMessage.textContent = "Erro ao dar moedas.";
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

    try {
        const docRef = doc(db, "players", selectedPlayerId);
        const docSnap = await getDoc(docRef);
        const currentData = docSnap.exists() ? docSnap.data() : {};
        const currentInventory = currentData.inventory || {};
        if (!currentInventory[treasureName]) {
            currentInventory[treasureName] = { ...treasureToGive, quantity: 0 };
        }
        currentInventory[treasureName].quantity++;
        await updateDoc(docRef, {
            inventory: currentInventory,
            totalItems: (currentData.totalItems || 0) + 1
        });
        updateAdminInventoryUI(currentInventory);
        adminFeedbackMessage.textContent = `${treasureToGive.name} adicionado ao inventário de ${selectedPlayerUsername}.`;
    } catch (e) {
        console.error("Erro ao dar tesouro:", e);
        adminFeedbackMessage.textContent = "Erro ao dar tesouro.";
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
    try {
        const docRef = doc(db, "players", selectedPlayerId);
        const docSnap = await getDoc(docRef);
        const currentCapacity = docSnap.exists() ? (docSnap.data().capacity || 20) : 20;
        await updateDoc(docRef, { capacity: currentCapacity + value });
        adminFeedbackMessage.textContent = `Capacidade de ${selectedPlayerUsername} aumentada em ${value}.`;
    } catch (e) {
        console.error("Erro ao aumentar capacidade:", e);
        adminFeedbackMessage.textContent = "Erro ao aumentar capacidade.";
    }
}

// Funções de Login e Salvar
async function saveGame() {
    if (!currentUserId) return;
    try {
        const userData = {
            score: score,
            inventory: inventory,
            capacity: capacity,
            totalItems: totalItems,
            expandCost: expandCost,
            accountId: accountIdDisplay.textContent
        };
        await updateDoc(doc(db, "players", currentUserId), userData, { merge: true });
        console.log("Jogo salvo com sucesso no Firebase!");
    } catch (e) {
        console.error("Erro ao salvar o jogo:", e);
    }
}

async function loadGame(userData) {
    score = userData.score || 0;
    inventory = userData.inventory || {};
    capacity = userData.capacity || 20;
    totalItems = userData.totalItems || 0;
    expandCost = userData.expandCost || 100;

    usernameDisplay.textContent = userData.username;
    accountIdDisplay.textContent = userData.accountId;

    loginPanel.classList.add("hidden");
    gameArea.classList.remove("hidden");

    if (userData.isAdmin) {
        if (!openAdminPanelButton.parentNode) gameArea.appendChild(openAdminPanelButton);
    } else {
        if (openAdminPanelButton.parentNode) {
            openAdminPanelButton.parentNode.removeChild(openAdminPanelButton);
        }
    }
    updateInventoryUI();
    updateCapacityBar();
    showMessage("");
    if (lastFrameTime === 0) {
        requestAnimationFrame(gameLoop);
    }
}

window.addEventListener('beforeunload', async (event) => {
    if (currentUserId) {
        await saveGame();
    }
});

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUserId = user.uid;
        try {
            const docRef = doc(db, "players", currentUserId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                // Se o documento existe, carrega os dados e o ID fixo
                await loadGame(docSnap.data());
            } else {
                // Isso só deve acontecer se o registro não salvou o doc
                // ou se a conta foi criada manualmente no Firebase.
                // Geramos e salvamos aqui para garantir a consistência.
                console.log("Criando novo perfil para o usuário logado.");
                
                const newAccountId = Math.floor(Math.random() * 900000) + 100000;

                const initialData = {
                    username: user.email.split('@')[0], 
                    score: 100,
                    inventory: {},
                    capacity: 20,
                    totalItems: 0,
                    expandCost: 100,
                    isAdmin: (user.email === "dono2@test.com"),
                    accountId: newAccountId,
                };
                
                await setDoc(docRef, initialData);
                await loadGame(initialData);
            }
        } catch (e) {
            console.error("Erro ao carregar dados do usuário:", e);
            showMessage("Erro ao carregar seu perfil. Tente novamente.");
        }
    } else {
        currentUserId = null;
        loginPanel.classList.remove("hidden");
        gameArea.classList.add("hidden");
    }
});

registerButton.addEventListener("click", async () => {
    const username = usernameInput.value;
    const password = passwordInput.value;
    const email = `${username}@meujogo.com`;

    if (!username || !password || password.length < 6) {
        showMessage("Nome de usuário e senha (mínimo 6 caracteres) são obrigatórios.");
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Gerar e salvar o ID fixo no Firestore imediatamente
        const newAccountId = Math.floor(Math.random() * 900000) + 100000;
        
        const initialData = {
            username: username,
            score: 100,
            inventory: {},
            capacity: 20,
            totalItems: 0,
            expandCost: 100,
            isAdmin: (user.email === "dono2@test.com"),
            accountId: newAccountId,
        };

        await setDoc(doc(db, "players", user.uid), initialData);

        showMessage("Conta criada com sucesso! Você será logado automaticamente.");
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            showMessage("Este usuário já existe.");
        } else {
            showMessage("Erro ao criar conta: " + error.message);
            console.error(error);
        }
    }
});

loginButton.addEventListener("click", async () => {
    const username = usernameInput.value;
    const password = passwordInput.value;
    const email = `${username}@meujogo.com`;

    if (!username || !password) {
        showMessage("Nome de usuário e senha são obrigatórios.");
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);
        showMessage("Login realizado com sucesso!");
    } catch (error) {
        if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
            showMessage("Usuário ou senha incorretos.");
        } else {
            showMessage("Erro ao fazer login: " + error.message);
            console.error(error);
        }
    }
});

logoutButton.addEventListener("click", async () => {
    try {
        await signOut(auth);
        showMessage("Você saiu da sua conta.");
    } catch (error) {
        console.error("Erro ao sair da conta: ", error);
        showMessage("Erro ao sair da conta: " + error.message);
    }
});

function showMessage(text) {
    message.textContent = text;
}

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

    treasure.style.position = "absolute";
    treasure.style.top = "-60px";
    const beltRect = conveyorBelt.getBoundingClientRect();
    const centralPosition = (beltRect.width / 2) - 25;
    treasure.style.left = centralPosition + "px";

    treasure.innerHTML = `<img src="${treasureData.img}" alt="${treasureData.name}"><div class="treasure-info">💰 ${treasureData.value} | ⚡ ${treasureData.auria}/s</div>`;
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
    if (totalItems >= capacity) {
        alert("Inventário cheio!");
        return;
    }
    if (score < treasureData.value) {
        alert("Moedas insuficientes!");
        return;
    }
    score -= treasureData.value;
    if (!inventory[treasureData.name]) {
        inventory[treasureData.name] = { ...treasureData, quantity: 0 };
    }
    inventory[treasureData.name].quantity++;
    totalItems++;
    updateInventoryUI();
    updateCapacityBar();
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

    setTimeout(() => {
        if (treasureElement.parentNode) treasureElement.remove();
    }, 1000);
}

function updateInventoryUI() {
    inventoryItems.innerHTML = "";
    Object.values(inventory).forEach(item => {
        const div = document.createElement("div");
        div.classList.add("inventory-item", item.rarity);
        div.innerHTML = `<img src="${item.img}" alt="${item.name}"><span class="item-quantity">${item.quantity}</span>`;
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
        const headerTitle = document.querySelector("#inventory-container .inventory-header h2");
        if (headerTitle) headerTitle.textContent = "Inventário (Visualização)";
        const scoreP = document.querySelector("#inventory-container p.score-display");
        if (scoreP) scoreP.textContent = "Moedas: " + Math.floor(score);
        const userP = document.querySelector("#inventory-container p.username-display");
        if (userP) userP.textContent = "Usuário: " + usernameDisplay.textContent;
        const idP = document.querySelector("#inventory-container p.account-id");
        if (idP) idP.textContent = "ID da Conta: " + accountIdDisplay.textContent;
    } else {
        expandButton.style.display = "block";
        logoutButton.style.display = "block";
        const backButton = document.getElementById("back-button");
        if (backButton) backButton.remove();
        const headerTitle = document.querySelector("#inventory-container .inventory-header h2");
        if (headerTitle) headerTitle.textContent = "Inventário";
        const scoreP = document.querySelector("#inventory-container p.score-display");
        if (scoreP) scoreP.textContent = `Moedas: ${Math.floor(score)}`;
        const userP = document.querySelector("#inventory-container p.username-display");
        if (userP) userP.textContent = `Usuário: ${usernameInput.value}`;
        const idP = document.querySelector("#inventory-container p.account-id");
        if (idP) idP.textContent = `ID da Conta: ${accountIdDisplay.textContent}`;
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
    score = savedAdminState.score;
    inventory = savedAdminState.inventory;
    capacity = savedAdminState.capacity;
    totalItems = savedAdminState.totalItems;
    expandCost = savedAdminState.expandCost;
    usernameDisplay.textContent = savedAdminState.username;
    accountIdDisplay.textContent = savedAdminState.id;
    isViewingOtherPlayer = false;
    updateInventoryUI();
    updateCapacityBar();
    inventoryContainer.classList.remove("open");
}

async function sellItem(item) {
    if (item.quantity <= 0) return;
    item.quantity--;
    totalItems--;
    score += item.value;
    if (item.quantity === 0) delete inventory[item.name];
    updateInventoryUI();
    updateCapacityBar();
    infoModal.classList.remove("open");
    await saveGame();
}

function updateCapacityBar() {
    const percent = capacity > 0 ? (totalItems / capacity) * 100 : 0;
    capacityFill.style.width = percent + "%";
}

async function generateAuria() {
    let totalAuria = 0;
    Object.values(inventory).forEach(item => {
        totalAuria += item.quantity * item.auria;
    });
    score += totalAuria;
    updateInventoryUI();
    await saveGame();
}

expandButton.addEventListener("click", async () => {
    if (score >= expandCost) {
        score -= expandCost;
        capacity += 10;
        expandCost += 50;
        expandButton.textContent = `Aumentar Capacidade (${expandCost} moedas)`;
        updateInventoryUI();
        updateCapacityBar();
        await saveGame();
    } else {
        alert("Moedas insuficientes!");
    }
});

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

// GAME LOOP
function gameLoop(currentTime) {
    if (!lastFrameTime) lastFrameTime = currentTime;

    if (document.hidden) {
        lastFrameTime = currentTime;
        requestAnimationFrame(gameLoop);
        return;
    }

    let deltaTime = currentTime - lastFrameTime;
    deltaTime = Math.min(deltaTime, MAX_DELTA);
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
        let currentTop = parseFloat(treasure.style.top);
        if (Number.isNaN(currentTop)) currentTop = -60;
        treasure.style.top = `${currentTop + (deltaTime * 0.05)}px`;

        const beltRect = conveyorBelt.getBoundingClientRect();
        const treasureTop = parseFloat(treasure.style.top) || 0;
        if (treasureTop > beltRect.height + 100) {
            if (treasure.parentNode) treasure.remove();
        }
    });
    requestAnimationFrame(gameLoop);
}

setInterval(async () => {
    if (currentUserId) {
        await saveGame();
    }
}, 60000);