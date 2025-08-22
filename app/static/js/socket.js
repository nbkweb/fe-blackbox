// Black Rock Terminal - Socket.IO Real-time Communication

class BlackRockSocket {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
    }

    // Initialize Socket Connection
    init(backendUrl = 'https://black-rock-be.onrender.com') {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        
        if (!token) {
            console.warn('No auth token found for socket connection');
            return;
        }

        this.socket = io(backendUrl, {
            auth: { token: token },
            transports: ['websocket', 'polling'],
            timeout: 20000,
            forceNew: true
        });

        this.setupEventHandlers();
    }

    // Setup Event Handlers
    setupEventHandlers() {
        // Connection Events
        this.socket.on('connect', () => {
            console.log('✅ Connected to Black Rock Terminal backend');
            this.connected = true;
            this.reconnectAttempts = 0;
            this.updateConnectionStatus(true);
            this.showConnectionNotification('Connected to payment gateway', 'success');
        });

        this.socket.on('disconnect', (reason) => {
            console.log('❌ Disconnected from backend:', reason);
            this.connected = false;
            this.updateConnectionStatus(false);
            this.showConnectionNotification('Disconnected from payment gateway', 'warning');
            
            if (reason === 'io server disconnect') {
                // Server disconnected, try to reconnect
                this.attemptReconnect();
            }
        });

        this.socket.on('connect_error', (error) => {
            console.error('🔴 Connection error:', error);
            this.connected = false;
            this.updateConnectionStatus(false);
            this.attemptReconnect();
        });

        // Authentication Events
        this.socket.on('authentication_success', (data) => {
            console.log('✅ Socket authentication successful:', data);
            this.showConnectionNotification('Authentication successful', 'success');
        });

        this.socket.on('authentication_failed', (data) => {
            console.error('❌ Socket authentication failed:', data);
            this.showConnectionNotification('Authentication failed', 'error');
        });

        // Transaction Events
        this.socket.on('transaction_result', (data) => {
            console.log('📊 Transaction result received:', data);
            this.handleTransactionResult(data);
        });

        this.socket.on('transaction_update', (data) => {
            console.log('📈 Transaction update received:', data);
            this.handleTransactionUpdate(data);
        });

        this.socket.on('transaction_processing', (data) => {
            console.log('⏳ Transaction processing:', data);
            this.handleTransactionProcessing(data);
        });

        // MTI Events
        this.socket.on('mti_acknowledgement', (data) => {
            console.log('🔄 MTI acknowledgement received:', data);
            this.handleMTIAcknowledgement(data);
        });

        // Payout Events
        this.socket.on('payout_notification', (data) => {
            console.log('💰 Payout notification received:', data);
            this.handlePayoutNotification(data);
        });

        this.socket.on('payout_triggered', (data) => {
            console.log('🚀 Payout triggered:', data);
            this.handlePayoutTriggered(data);
        });

        // System Events
        this.socket.on('system_alert', (data) => {
            console.log('🚨 System alert:', data);
            this.handleSystemAlert(data);
        });

        this.socket.on('system_message', (data) => {
            console.log('📢 System message:', data);
            this.handleSystemMessage(data);
        });

        // Error Events
        this.socket.on('transaction_error', (data) => {
            console.error('❌ Transaction error:', data);
            this.handleTransactionError(data);
        });

        this.socket.on('error', (error) => {
            console.error('🔴 Socket error:', error);
            this.showConnectionNotification('Connection error occurred', 'error');
        });
    }

    // Connection Status Management
    updateConnectionStatus(isConnected) {
        const statusElements = document.querySelectorAll('#connectionStatus, #realtimeStatus, #wsStatus');
        statusElements.forEach(element => {
            if (element) {
                element.className = `w-3 h-3 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`;
            }
        });

        const serverStatusElements = document.querySelectorAll('#serverStatus');
        serverStatusElements.forEach(element => {
            if (element) {
                element.textContent = isConnected ? 'Connected' : 'Disconnected';
                element.className = isConnected ? 'text-green-600' : 'text-red-600';
            }
        });
    }

    // Reconnection Logic
    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            this.showConnectionNotification('Connection lost. Please refresh the page.', 'error');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`);
        
        setTimeout(() => {
            if (this.socket) {
                this.socket.connect();
            }
        }, delay);
    }

    // Event Handlers
    handleTransactionResult(data) {
        if (window.handleTransactionResult) {
            window.handleTransactionResult(data);
        }
        
        this.addLiveUpdate('transaction', `Transaction ${data.transaction_id}: ${data.success ? 'APPROVED' : 'DECLINED'}`);
    }

    handleTransactionUpdate(data) {
        if (window.updateTransactionInTable) {
            window.updateTransactionInTable(data);
        }
        
        this.addLiveUpdate('transaction', `Transaction ${data.transaction_id} updated: ${data.status}`);
    }

    handleTransactionProcessing(data) {
        this.addLiveUpdate('transaction', `Processing transaction: ${data.transaction_id}`);
    }

    handleMTIAcknowledgement(data) {
        if (window.updateProcessingStep) {
            window.updateProcessingStep('mti', 'completed');
        }
        
        this.addLiveUpdate('mti', `MTI ${data.mti} acknowledged for ${data.transaction_id}`);
        
        // Update MTI notifications in UI
        const mtiContainers = document.querySelectorAll('#mtiUpdates, #mtiNotifications, #mtiUpdatesHistory');
        mtiContainers.forEach(container => {
            if (container) {
                this.addUpdateToContainer(container, `MTI ${data.mti} acknowledged`, 'mti');
            }
        });
    }

    handlePayoutNotification(data) {
        if (window.updateProcessingStep) {
            window.updateProcessingStep('payout', data.payout_status === 'completed' ? 'completed' : 'processing');
        }
        
        this.addLiveUpdate('payout', `Payout ${data.payout_status}: $${data.amount} ${data.currency}`);
        
        // Update payout notifications in UI
        const payoutContainers = document.querySelectorAll('#payoutUpdates, #payoutNotifications, #payoutUpdatesHistory');
        payoutContainers.forEach(container => {
            if (container) {
                this.addUpdateToContainer(container, `Payout ${data.payout_status}: $${data.amount}`, 'payout');
            }
        });

        // Handle payout references
        if (data.payout_reference) {
            this.handlePayoutReference(data);
        }
    }

    handlePayoutTriggered(data) {
        this.addLiveUpdate('payout', `Payout triggered: $${data.amount} ${data.currency} via ${data.payout_method}`);
        
        if (window.moveToProcessingPayouts) {
            window.moveToProcessingPayouts(data);
        }
    }

    handlePayoutReference(data) {
        // Add to bank references if bank payout
        if (data.payout_method === 'bank' && data.payout_reference) {
            const bankContainers = document.querySelectorAll('#bankReferences');
            bankContainers.forEach(container => {
                if (container) {
                    this.addBankReference(container, data.payout_reference, data.amount, data.currency);
                }
            });
        }
        
        // Add to blockchain hashes if crypto payout
        if (data.payout_method === 'crypto' && data.blockchain_hash) {
            const cryptoContainers = document.querySelectorAll('#blockchainHashes');
            cryptoContainers.forEach(container => {
                if (container) {
                    this.addBlockchainHash(container, data.blockchain_hash, data.amount, data.currency, data.network);
                }
            });
        }
    }

    handleSystemAlert(data) {
        this.showConnectionNotification(data.message, data.type || 'warning');
    }

    handleSystemMessage(data) {
        this.addLiveUpdate('system', data.message);
    }

    handleTransactionError(data) {
        if (window.showTransactionFailure) {
            window.showTransactionFailure(data);
        }
        
        this.addLiveUpdate('error', `Transaction error: ${data.error}`);
        this.showConnectionNotification('Transaction processing error', 'error');
    }

    // UI Update Helpers
    addLiveUpdate(type, message) {
        const containers = document.querySelectorAll('#liveUpdates, #realTimeUpdates');
        containers.forEach(container => {
            if (container) {
                this.addUpdateToContainer(container, message, type);
            }
        });
    }

    addUpdateToContainer(container, message, type) {
        // Clear placeholder text
        if (container.innerHTML.includes('Monitoring') || container.innerHTML.includes('Waiting')) {
            container.innerHTML = '';
        }
        
        const updateDiv = document.createElement('div');
        updateDiv.className = `text-sm mb-2 p-2 bg-white rounded border live-update ${
            type === 'mti' ? 'border-blue-200' :
            type === 'payout' ? 'border-green-200' :
            type === 'error' ? 'border-red-200' :
            'border-gray-200'
        }`;
        
        updateDiv.innerHTML = `
            <div class="font-bold text-gray-800">${message}</div>
            <div class="text-gray-500 text-xs">${new Date().toLocaleString()}</div>
        `;
        
        container.insertBefore(updateDiv, container.firstChild);
        
        // Keep only last 10 updates
        while (container.children.length > 10) {
            container.removeChild(container.lastChild);
        }
    }

    addBankReference(container, reference, amount, currency) {
        if (container.innerHTML.includes('No bank references')) {
            container.innerHTML = '';
        }
        
        const refDiv = document.createElement('div');
        refDiv.className = 'bg-blue-50 border border-blue-200 rounded p-2 text-xs';
        refDiv.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <div class="font-mono font-bold text-blue-800">${reference}</div>
                    <div class="text-blue-600">$${amount} ${currency}</div>
                </div>
                <button onclick="BlackRockTerminal.copyToClipboard('${reference}')" class="text-blue-600 hover:text-blue-800" title="Copy Reference">
                    <i class="fas fa-copy"></i>
                </button>
            </div>
        `;
        
        container.insertBefore(refDiv, container.firstChild);
        
        while (container.children.length > 5) {
            container.removeChild(container.lastChild);
        }
    }

    addBlockchainHash(container, hash, amount, currency, network) {
        if (container.innerHTML.includes('No blockchain')) {
            container.innerHTML = '';
        }
        
        const hashDiv = document.createElement('div');
        hashDiv.className = 'bg-orange-50 border border-orange-200 rounded p-2 text-xs';
        hashDiv.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <div class="font-mono font-bold text-orange-800">${hash.substring(0, 16)}...</div>
                    <div class="text-orange-600">${amount} ${currency} (${network})</div>
                </div>
                <div class="flex space-x-1">
                    <button onclick="window.open('${this.getExplorerUrl(hash, network)}', '_blank')" class="text-orange-600 hover:text-orange-800" title="View on Blockchain">
                        <i class="fas fa-external-link-alt"></i>
                    </button>
                    <button onclick="BlackRockTerminal.copyToClipboard('${hash}')" class="text-orange-600 hover:text-orange-800" title="Copy Hash">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </div>
        `;
        
        container.insertBefore(hashDiv, container.firstChild);
        
        while (container.children.length > 5) {
            container.removeChild(container.lastChild);
        }
    }

    getExplorerUrl(hash, network) {
        const explorers = {
            'ETH': 'https://etherscan.io/tx/',
            'ETHEREUM': 'https://etherscan.io/tx/',
            'MATIC': 'https://polygonscan.com/tx/',
            'POLYGON': 'https://polygonscan.com/tx/',
            'TRX': 'https://tronscan.org/#/transaction/',
            'TRON': 'https://tronscan.org/#/transaction/'
        };
        
        const baseUrl = explorers[network.toUpperCase()];
        return baseUrl ? baseUrl + hash : '#';
    }

    showConnectionNotification(message, type) {
        if (window.BlackRockTerminal && window.BlackRockTerminal.showNotification) {
            window.BlackRockTerminal.showNotification(message, type, 3000);
        }
    }

    // Emit Events
    processTransaction(transactionData) {
        if (this.connected && this.socket) {
            console.log('📤 Emitting transaction for processing:', transactionData);
            this.socket.emit('process_transaction', transactionData);
        } else {
            console.error('Socket not connected, cannot process transaction');
            throw new Error('Not connected to payment gateway');
        }
    }

    getTransactionStatus(transactionId) {
        if (this.connected && this.socket) {
            this.socket.emit('get_transaction_status', transactionId);
        }
    }

    joinMerchantRoom() {
        if (this.connected && this.socket) {
            this.socket.emit('join_merchant_room');
        }
    }

    subscribeToNotifications(types) {
        if (this.connected && this.socket) {
            this.socket.emit('subscribe_notifications', { types: types });
        }
    }

    sendHeartbeat() {
        if (this.connected && this.socket) {
            this.socket.emit('heartbeat', { 
                timestamp: new Date().toISOString(),
                terminal_id: 'BRT-001'
            });
        }
    }

    // Disconnect
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
        }
    }

    // Check Connection Status
    isConnected() {
        return this.connected && this.socket && this.socket.connected;
    }
}

// Initialize Socket Instance
const blackRockSocket = new BlackRockSocket();

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if we have an auth token
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (token) {
        blackRockSocket.init();
        
        // Join merchant room
        setTimeout(() => {
            blackRockSocket.joinMerchantRoom();
        }, 1000);
        
        // Subscribe to all notification types
        setTimeout(() => {
            blackRockSocket.subscribeToNotifications([
                'mti_notifications',
                'payout_notifications', 
                'transaction_updates'
            ]);
        }, 2000);
        
        // Send periodic heartbeat
        setInterval(() => {
            blackRockSocket.sendHeartbeat();
        }, 30000); // Every 30 seconds
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (blackRockSocket) {
        blackRockSocket.disconnect();
    }
});

// Export for global use
window.BlackRockSocket = blackRockSocket;