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

// NOVOS BOTÕES ADMIN
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

// IDs das contas admin.
let ADMIN_IDS = JSON.parse(localStorage.getItem('ADMIN_IDS')) || ["WHZTUDRF"];

// Botão de admin para abrir o painel
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

function populatePlayerList() {
    playerListContainer.innerHTML = "";
    for (let i = 0; i < localStorage.length; i++) {
        const usernameKey = localStorage.key(i);
        if (usernameKey.startsWith('onlineStatus-') || usernameKey === 'lastLoggedInUser' || usernameKey === 'ADMIN_IDS') {
            continue;
        }

        try {
            const userData = JSON.parse(localStorage.getItem(usernameKey));
            if (userData && userData.id) {
                const playerItem = document.createElement("div");
                playerItem.classList.add("player-list-item");
                
                const playerNameSpan = document.createElement("span");
                playerNameSpan.textContent = usernameKey;
                playerItem.appendChild(playerNameSpan);

                const statusIndicator = document.createElement("div");
                statusIndicator.classList.add("online-status");
                
                const onlineStatus = localStorage.getItem('onlineStatus-' + userData.id);
                if (onlineStatus === 'true') {
                    statusIndicator.classList.add("online");
                    playerNameSpan.textContent += " (Online)";
                } else {
                    statusIndicator.classList.add("offline");
                    playerNameSpan.textContent += " (Offline)";
                }
                playerItem.appendChild(statusIndicator);

                playerItem.dataset.id = userData.id;
                playerItem.dataset.username = usernameKey;
                playerItem.addEventListener("click", () => {
                    selectPlayer(userData.id, usernameKey);
                });
                playerListContainer.appendChild(playerItem);
            }
        } catch (e) {
            console.error("Erro ao carregar dados do usuário:", e);
            continue;
        }
    }
}

function selectPlayer(accountId, username) {
    selectedPlayerId = accountId;
    selectedPlayerUsername = username;
    const targetUser = findUserByAccountId(accountId);
    if (!targetUser) {
        adminFeedbackMessage.textContent = "Erro: Jogador não encontrado.";
        return;
    }

    playerDetailsName.textContent = selectedPlayerUsername;
    playerDetailsId.textContent = targetUser.userData.id;
    playerDetailsScore.textContent = Math.floor(targetUser.userData.score);
    
    playerDetailsPanel.classList.remove("hidden");
    adminFeedbackMessage.textContent = "";

    document.querySelectorAll(".player-list-item").forEach(item => {
        item.classList.remove("selected");
        if (item.dataset.id === accountId) {
            item.classList.add("selected");
        }
    });

    const adminCommandSection = document.querySelector("#player-details-panel .admin-command-section");
    // Limpa a seção para evitar duplicatas antes de reconstruir
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

    // Atribui os event listeners aos botões recém-criados
    document.getElementById("give-coins-button").addEventListener("click", handleGiveCoins);
    document.getElementById("give-treasure-button").addEventListener("click", handleGiveTreasure);
    document.getElementById("delete-account-button").onclick = handleDeleteAccount;
    document.getElementById("add-admin-button").onclick = handleAddAdmin;
    document.getElementById("remove-admin-button").onclick = handleRemoveAdmin;
    document.getElementById("increase-capacity-button").onclick = handleIncreaseCapacity;
    
    // Atualiza o inventário do jogador selecionado
    updateAdminInventoryUI(targetUser.userData.inventory || {});
}

function handleDeleteAccount() {
    if (selectedPlayerId === accountIdDisplay.textContent) {
        adminFeedbackMessage.textContent = "Não é possível excluir a sua própria conta.";
        return;
    }

    if (confirm(`Tem certeza que deseja excluir a conta de ${selectedPlayerUsername} (${selectedPlayerId})? Esta ação é irreversível.`)) {
        const targetUser = findUserByAccountId(selectedPlayerId);
        if (targetUser) {
            localStorage.removeItem(targetUser.key);
            localStorage.removeItem('onlineStatus-' + selectedPlayerId);
            
            const adminIndex = ADMIN_IDS.indexOf(selectedPlayerId);
            if(adminIndex > -1) {
                ADMIN_IDS.splice(adminIndex, 1);
                localStorage.setItem('ADMIN_IDS', JSON.stringify(ADMIN_IDS));
            }

            adminFeedbackMessage.textContent = `A conta de ${selectedPlayerUsername} foi excluída permanentemente.`;
            playerDetailsPanel.classList.add("hidden");
            populatePlayerList();
        } else {
            adminFeedbackMessage.textContent = "Erro: Jogador não encontrado.";
        }
    }
}

function handleAddAdmin() {
    if (ADMIN_IDS.includes(selectedPlayerId)) {
        adminFeedbackMessage.textContent = `${selectedPlayerUsername} já é um administrador.`;
    } else {
        ADMIN_IDS.push(selectedPlayerId);
        localStorage.setItem('ADMIN_IDS', JSON.stringify(ADMIN_IDS));
        adminFeedbackMessage.textContent = `${selectedPlayerUsername} agora é um administrador.`;
    }
}

function handleRemoveAdmin() {
    const index = ADMIN_IDS.indexOf(selectedPlayerId);
    if (index > -1) {
        if (selectedPlayerId === accountIdDisplay.textContent) {
            adminFeedbackMessage.textContent = "Não é possível remover seu próprio status de administrador.";
            return;
        }
        ADMIN_IDS.splice(index, 1);
        localStorage.setItem('ADMIN_IDS', JSON.stringify(ADMIN_IDS));
        adminFeedbackMessage.textContent = `${selectedPlayerUsername} não é mais um administrador.`;
    } else {
        adminFeedbackMessage.textContent = `${selectedPlayerUsername} não tem status de administrador.`;
    }
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

function handleGiveCoins() {
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

    const targetUser = findUserByAccountId(selectedPlayerId);
    if (targetUser) {
        const newScore = targetUser.userData.score + value;
        targetUser.userData.score = newScore;
        localStorage.setItem(targetUser.key, JSON.stringify(targetUser.userData));
        playerDetailsScore.textContent = Math.floor(newScore);
        adminFeedbackMessage.textContent = `${value} moedas adicionadas para ${targetUser.key}.`;
        
        window.dispatchEvent(new StorageEvent('storage', { key: targetUser.key, newValue: JSON.stringify(targetUser.userData) }));
    }
}

function handleGiveTreasure() {
    if (!selectedPlayerId) {
        adminFeedbackMessage.textContent = "Nenhum jogador selecionado.";
        return;
    }
    const giveTreasureSelect = document.getElementById("give-treasure-select");
    const treasureName = giveTreasureSelect.value;
    const treasureToGive = treasures.find(t => t.name === treasureName);

    const targetUser = findUserByAccountId(selectedPlayerId);
    if (targetUser && treasureToGive) {
        if (!targetUser.userData.inventory) targetUser.userData.inventory = {};
        if (!targetUser.userData.inventory[treasureToGive.name]) {
            targetUser.userData.inventory[treasureToGive.name] = { ...treasureToGive, quantity: 0 };
        }
        targetUser.userData.inventory[treasureToGive.name].quantity++;
        targetUser.userData.totalItems++;
        localStorage.setItem(targetUser.key, JSON.stringify(targetUser.userData));
        updateAdminInventoryUI(targetUser.userData.inventory);
        adminFeedbackMessage.textContent = `${treasureToGive.name} adicionado ao inventário de ${targetUser.key}.`;
        
        window.dispatchEvent(new StorageEvent('storage', { key: targetUser.key, newValue: JSON.stringify(targetUser.userData) }));
    }
}

// NOVA FUNÇÃO: Aumentar capacidade do jogador
function handleIncreaseCapacity() {
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

    const targetUser = findUserByAccountId(selectedPlayerId);
    if (targetUser) {
        const newCapacity = targetUser.userData.capacity + value;
        targetUser.userData.capacity = newCapacity;
        localStorage.setItem(targetUser.key, JSON.stringify(targetUser.userData));
        adminFeedbackMessage.textContent = `Capacidade do inventário de ${targetUser.key} aumentada em ${value}. Nova capacidade: ${newCapacity}.`;
        
        // Atualiza a UI do admin para refletir a mudança
        playerDetailsPanel.classList.remove("hidden");
        // Dispara o evento de storage para a conta do jogador receber a atualização em tempo real
        window.dispatchEvent(new StorageEvent('storage', { key: targetUser.key, newValue: JSON.stringify(targetUser.userData) }));
    }
}

// Funções de Login e Salvar
function generateId() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
}

function findUserByAccountId(accountId) {
    for (let i = 0; i < localStorage.length; i++) {
        const usernameKey = localStorage.key(i);
        try {
            const userData = JSON.parse(localStorage.getItem(usernameKey));
            if (userData && userData.id === accountId) {
                return { key: usernameKey, userData: userData };
            }
        } catch (e) {
            continue;
        }
    }
    return null;
}

function saveGame() {
    const username = usernameInput.value;
    if (username) {
        const userData = {
            score: score,
            inventory: inventory,
            capacity: capacity,
            totalItems: totalItems,
            expandCost: expandCost,
            password: passwordInput.value,
            id: accountIdDisplay.textContent
        };
        localStorage.setItem(username, JSON.stringify(userData));
    }
}

function loadGame(userData) {
    score = userData.score || 0;
    inventory = userData.inventory || {};
    capacity = userData.capacity || 20;
    totalItems = userData.totalItems || 0;
    expandCost = userData.expandCost || 100;
    
    usernameDisplay.textContent = usernameInput.value;
    accountIdDisplay.textContent = userData.id;

    loginPanel.classList.add("hidden");
    gameArea.classList.remove("hidden");

    if (ADMIN_IDS.includes(userData.id)) {
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

function saveLogin(username) {
    localStorage.setItem('lastLoggedInUser', username);
}

function clearLogin() {
    localStorage.removeItem('lastLoggedInUser');
    usernameInput.value = "";
}

function handleBeforeUnload() {
    if (usernameInput.value) {
        saveGame();
        const userData = JSON.parse(localStorage.getItem(usernameInput.value));
        if (userData) {
            localStorage.setItem('onlineStatus-' + userData.id, 'false');
        }
    }
}
window.addEventListener('beforeunload', handleBeforeUnload);

document.addEventListener('DOMContentLoaded', () => {
    const lastUser = localStorage.getItem('lastLoggedInUser');
    if (lastUser) {
        usernameInput.value = lastUser;
        rememberMeCheckbox.checked = true;
    }
});


loginButton.addEventListener("click", () => {
    const username = usernameInput.value;
    const password = passwordInput.value;
    const userDataString = localStorage.getItem(username);

    if (userDataString) {
        try {
            const userData = JSON.parse(userDataString);
            if (userData.password === password) {
                loadGame(userData);
                localStorage.setItem('onlineStatus-' + userData.id, 'true');
                if (rememberMeCheckbox.checked) {
                    saveLogin(username);
                } else {
                    clearLogin();
                }
            } else {
                message.textContent = "Senha incorreta!";
            }
        } catch (e) {
            message.textContent = "Erro ao carregar os dados. Tente criar uma nova conta.";
        }
    } else {
        message.textContent = "Usuário não encontrado. Por favor, crie uma conta.";
    }
});

registerButton.addEventListener("click", () => {
    const username = usernameInput.value;
    const password = passwordInput.value;

    if (localStorage.getItem(username)) {
        message.textContent = "Nome de usuário já existe.";
    } else if (username && password) {
        const initialData = {
            score: 100,
            inventory: {},
            capacity: 20,
            totalItems: 0,
            expandCost: 100,
            password: password,
            id: generateId()
        };

        if (username === "admin2" && password === "acesso") {
            initialData.id = "WHZTUDRF";
        }

        localStorage.setItem(username, JSON.stringify(initialData));
        loadGame(initialData);
        localStorage.setItem('onlineStatus-' + initialData.id, 'true');
        if (rememberMeCheckbox.checked) {
            saveLogin(username);
        } else {
            clearLogin();
        }
        message.textContent = "Conta criada com sucesso!";
    } else {
        message.textContent = "Por favor, preencha todos os campos.";
    }
});

logoutButton.addEventListener("click", () => {
    localStorage.setItem('onlineStatus-' + accountIdDisplay.textContent, 'false');
    saveGame();
    loginPanel.classList.remove("hidden");
    gameArea.classList.add("hidden");
    newAdminPanel.classList.add("hidden");
    if (openAdminPanelButton.parentNode) {
        openAdminPanelButton.parentNode.removeChild(openAdminPanelButton);
    }
    usernameInput.value = "";
    passwordInput.value = "";
    clearLogin();
});

// Funções do jogo
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

function buyTreasureWithAnimation(treasureElement, treasureData) {
    if (totalItems >= capacity) { alert("Inventário cheio!"); return; }
    if (score < treasureData.value) { alert("Moedas insuficientes!"); return; }

    score -= treasureData.value;

    if (!inventory[treasureData.name]) {
        inventory[treasureData.name] = { ...treasureData, quantity: 0 };
    }
    inventory[treasureData.name].quantity++;
    totalItems++;
    updateInventoryUI();
    updateCapacityBar();

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
        treasureElement.remove();
        // AQUI: Salva o jogo depois de comprar um item
        saveGame();
    }, 1000);
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

function sellItem(item) {
    if (item.quantity <= 0) return;
    item.quantity--;
    totalItems--;
    score += item.value;
    if (item.quantity === 0) delete inventory[item.name];
    updateInventoryUI();
    updateCapacityBar();
    infoModal.classList.remove("open");
    // AQUI: Salva o jogo depois de vender um item
    saveGame();
}

function updateCapacityBar() {
    const percent = (totalItems / capacity) * 100;
    capacityFill.style.width = percent + "%";
}

function generateAuria() {
    let totalAuria = 0;
    Object.values(inventory).forEach(item => {
        totalAuria += item.quantity * item.auria;
    });
    score += totalAuria;
    updateInventoryUI();
}

expandButton.addEventListener("click", () => {
    if (score >= expandCost) {
        score -= expandCost;
        capacity += 10;
        expandCost += 50;
        expandButton.textContent = `Aumentar Capacidade (${expandCost} moedas)`;
        updateInventoryUI();
        updateCapacityBar();
        // AQUI: Salva o jogo depois de expandir a capacidade
        saveGame();
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

    // A lógica do jogo agora roda continuamente
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
window.addEventListener('storage', (event) => {
    if (event.key === usernameInput.value) {
        const updatedUserData = JSON.parse(localStorage.getItem(usernameInput.value));
        
        if (updatedUserData) {
            score = updatedUserData.score || score;
            inventory = updatedUserData.inventory || inventory;
            capacity = updatedUserData.capacity || capacity;
            totalItems = updatedUserData.totalItems || totalItems;
            expandCost = updatedUserData.expandCost || expandCost;
            
            updateInventoryUI();
            updateCapacityBar();
        }
    }
});