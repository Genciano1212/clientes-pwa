document.addEventListener('DOMContentLoaded', () => {
    // --- Firebase Configuration ---
    const firebaseConfig = {
        apiKey: "AIzaSyCU7_4gfdFek5E-rHE1usfwGcPnJqeJAFc",
        authDomain: "clientes-app-6b1ca.firebaseapp.com",
        projectId: "clientes-app-6b1ca",
        storageBucket: "clientes-app-6b1ca.firebasestorage.app",
        messagingSenderId: "79625671139",
        appId: "1:79625671139:web:7e243d54808609294010d6"
    };

    // --- Initialize Firebase and Firestore ---
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const clientsCollection = db.collection('clients');

    // --- DOM Elements ---
    const clientList = document.getElementById('client-list');
    const addClientBtn = document.getElementById('add-client-btn');
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');
    const refreshBtn = document.getElementById('refresh-btn');

    // --- Modals ---
    const userModal = document.getElementById('user-modal');
    const addClientModal = document.getElementById('add-client-modal');
    const transactionModal = document.getElementById('transaction-modal');
    const historyModal = document.getElementById('history-modal');
    const confirmDeleteModal = document.getElementById('confirm-delete-modal');

    // --- App State ---
    let localClients = [];
    let currentClientId = null;
    let username = localStorage.getItem('username') || null;

    // --- PWA Service Worker Registration ---
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js').then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            }, err => {
                console.log('ServiceWorker registration failed: ', err);
            });
        });
    }

    // --- User Handling ---
    function checkUser() {
        if (!username) {
            showModal(userModal);
        } else {
            initialize();
        }
    }

    document.getElementById('confirm-user-btn').addEventListener('click', () => {
        const usernameInput = document.getElementById('username-input');
        const name = usernameInput.value.trim();
        if (name) {
            username = name;
            localStorage.setItem('username', username);
            hideModal(userModal);
            initialize();
        }
    });

    // --- Main Initialization ---
    function initialize() {
        setupListeners();
        listenForClientUpdates();
    }

    // --- Firestore Real-time Listener ---
    function listenForClientUpdates() {
        clientsCollection.orderBy('isVip', 'desc').onSnapshot(snapshot => {
            localClients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderClients();
        }, error => {
            console.error("Error listening for client updates: ", error);
        });
    }

    // --- Rendering ---
    function renderClients() {
        const searchTerm = searchInput.value.toLowerCase();
        clientList.innerHTML = '';

        const filteredClients = searchTerm
            ? localClients.filter(client => client.name.toLowerCase().includes(searchTerm))
            : localClients;

        filteredClients.forEach(client => {
            const clientBox = document.createElement('div');
            clientBox.className = 'client-box';
            clientBox.dataset.id = client.id;
            clientBox.style.backgroundColor = client.color;

            let balanceText = '';
            if (client.balance > 0) {
                balanceText = `<p class="balance-debe">Debe: ${client.balance}</p>`;
            } else if (client.balance < 0) {
                balanceText = `<p class="balance-abonado">Abonado: ${-client.balance}</p>`;
            } else {
                balanceText = `<p>Al día</p>`;
            }

            clientBox.innerHTML = `
                <div class="settings-area">
                    <div class="settings-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.23C14.38,2,14.17,1.84,13.92,1.84 h-3.84c-0.25,0-0.46,0.16-0.48,0.39L9.21,5.03C8.62,5.27,8.09,5.59,7.59,5.97L5.2,5.01C4.98,4.94,4.73,5.01,4.61,5.23L2.69,8.55 C2.58,8.75,2.63,9.02,2.81,9.16l2.03,1.58C4.82,11.06,4.8,11.37,4.8,11.69c0,0.32,0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.39,2.8 c0.02,0.24,0.23,0.4,0.48,0.4h3.84c0.25,0,0.46-0.16,0.48-0.39l0.39-2.8c0.59-0.24,1.12-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.49-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg>
                    </div>
                </div>
                ${client.isVip ? '<div class="vip-star">⭐</div>' : ''}
                <h2>${client.name}</h2>
                ${balanceText}
            `;

            clientList.appendChild(clientBox);
        });
    }

    // --- Modals & Context Menu Logic ---
    function showModal(modal) { modal.classList.add('visible'); }
    function hideModal(modal) { modal.classList.remove('visible'); }

    function openContextMenu(event, id) {
        event.preventDefault();
        currentClientId = id;
        const client = localClients.find(c => c.id === id);
        menuVip.querySelector('.menu-text').textContent = client.isVip ? "Quitar VIP" : "Cliente VIP";
        contextMenu.style.top = `${event.clientY}px`;
        contextMenu.style.left = `${event.clientX}px`;
        contextMenu.style.display = 'block';
    }

    function openTransactionModal(id) {
        currentClientId = id;
        const client = localClients.find(c => c.id === id);
        document.getElementById('transaction-client-name').textContent = client.name;
        document.getElementById('transaction-amount').value = '';
        showModal(transactionModal);
    }

    // --- Event Listeners Setup ---
    function setupListeners() {
        // Main Controls
        addClientBtn.addEventListener('click', () => showModal(addClientModal));
        refreshBtn.addEventListener('click', () => location.reload());
        searchBtn.addEventListener('click', () => {
            searchInput.classList.toggle('hidden');
            addClientBtn.classList.toggle('hidden');
            if (!searchInput.classList.contains('hidden')) searchInput.focus();
        });
        searchInput.addEventListener('input', renderClients);

        // Client Box Clicks (Delegated)
        clientList.addEventListener('click', (e) => {
            const clientBox = e.target.closest('.client-box');
            if (!clientBox) return;
            const clientId = clientBox.dataset.id;

            const isSearchActive = !searchInput.classList.contains('hidden');

            if (e.target.closest('.settings-area')) {
                e.stopPropagation();
                openContextMenu(e, clientId);
            } else {
                openTransactionModal(clientId);
            }

            if (isSearchActive) hideSearch();
        });

        // Modals
        [userModal, addClientModal, transactionModal, historyModal, confirmDeleteModal].forEach(modal => {
            modal.addEventListener('click', (e) => { if (e.target === modal) hideModal(modal); });
        });

        document.getElementById('cancel-add-client').addEventListener('click', () => hideModal(addClientModal));
        document.getElementById('confirm-add-client').addEventListener('click', async () => {
            const name = document.getElementById('new-client-name').value.trim();
            if (name) {
                const newClient = {
                    name: name,
                    balance: 0,
                    history: [],
                    isVip: false,
                    color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 90%)`
                };
                try {
                    await clientsCollection.add(newClient);
                    hideModal(addClientModal);
                } catch (error) {
                    console.error("Error adding client: ", error);
                }
            }
        });

        document.getElementById('add-debt-btn').addEventListener('click', () => handleTransaction(true));
        document.getElementById('add-payment-btn').addEventListener('click', () => handleTransaction(false));

        document.getElementById('delete-history-btn').addEventListener('click', async () => {
            if (!currentClientId) return;
            if (confirm("¿Estás seguro de que quieres borrar todo el historial de este cliente?")) {
                try {
                    await clientsCollection.doc(currentClientId).update({ history: [] });
                    hideModal(historyModal);
                } catch (error) {
                    console.error("Error clearing history: ", error);
                }
            }
        });

        // Context Menu
        document.addEventListener('click', () => { contextMenu.style.display = 'none'; });
        document.getElementById('menu-history').addEventListener('click', () => {
            const client = localClients.find(c => c.id === currentClientId);
            document.getElementById('history-client-name').textContent = `Historial de ${client.name}`;
            const historyContent = document.getElementById('history-content');
            historyContent.innerHTML = client.history.length ? '' : '<p>No hay transacciones.</p>';
            client.history.slice().reverse().forEach(item => {
                const entry = document.createElement('p');
                const color = item.type === 'Deuda' ? 'var(--danger-color)' : 'var(--success-color)';
                entry.innerHTML = `<strong>${item.type}:</strong> <span style="color:${color}">${item.amount}</span>
                                   <div class="history-meta"><span>${item.user}</span><span>${item.date}</span></div>`;
                historyContent.appendChild(entry);
            });
            showModal(historyModal);
        });

        document.getElementById('menu-delete').addEventListener('click', () => showModal(confirmDeleteModal));
        document.getElementById('cancel-delete').addEventListener('click', () => hideModal(confirmDeleteModal));
        document.getElementById('confirm-delete').addEventListener('click', async () => {
            if (!currentClientId) return;
            try {
                await clientsCollection.doc(currentClientId).delete();
                hideModal(confirmDeleteModal);
            } catch (error) {
                console.error("Error deleting client: ", error);
            }
        });

        document.getElementById('menu-vip').addEventListener('click', async () => {
            if (!currentClientId) return;
            const client = localClients.find(c => c.id === currentClientId);
            try {
                await clientsCollection.doc(currentClientId).update({ isVip: !client.isVip });
            } catch (error) {
                console.error("Error updating VIP status: ", error);
            }
        });
    }

    // --- Helper Functions ---
    function hideSearch() {
        if (searchInput.classList.contains('hidden')) return;
        searchInput.value = '';
        searchInput.classList.add('hidden');
        addClientBtn.classList.remove('hidden');
        renderClients();
    }

    async function handleTransaction(isDebt) {
        const amountInput = document.getElementById('transaction-amount');
        const amount = parseInt(amountInput.value, 10);
        if (!isNaN(amount) && amount > 0 && currentClientId) {
            const clientRef = clientsCollection.doc(currentClientId);
            const transactionType = isDebt ? 'Deuda' : 'Pago';
            const newHistoryEntry = {
                type: transactionType,
                amount: amount,
                date: new Date().toLocaleString('es-ES'),
                user: username
            };
            try {
                await clientRef.update({
                    balance: firebase.firestore.FieldValue.increment(isDebt ? amount : -amount),
                    history: firebase.firestore.FieldValue.arrayUnion(newHistoryEntry)
                });
                hideModal(transactionModal);
            } catch (error) {
                console.error("Error handling transaction: ", error);
            }
        }
    }

    // --- Initial Execution ---
    checkUser();
});
