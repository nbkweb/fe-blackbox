// Black Rock Terminal - Print Functionality

class BlackRockPrint {
    constructor() {
        this.printSettings = {
            paperSize: 'thermal',
            fontSize: '12px',
            fontFamily: 'monospace',
            margins: '10mm',
            businessName: 'BLACK ROCK TERMINAL',
            businessAddress: '123 Business Street\nSuite 100\nCity, State 12345\nPhone: (555) 123-4567',
            footerMessage: 'Thank you for your business!',
            includeLogo: true,
            showTransactionId: true,
            showDateTime: true,
            showCardInfo: true,
            showAmount: true,
            showAuthCode: true,
            showProtocol: false
        };
        
        this.loadPrintSettings();
    }

    // Load Print Settings from Local Storage
    loadPrintSettings() {
        try {
            const saved = localStorage.getItem('blackrock_print_settings');
            if (saved) {
                this.printSettings = { ...this.printSettings, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.error('Error loading print settings:', error);
        }
    }

    // Save Print Settings to Local Storage
    savePrintSettings(settings) {
        try {
            this.printSettings = { ...this.printSettings, ...settings };
            localStorage.setItem('blackrock_print_settings', JSON.stringify(this.printSettings));
        } catch (error) {
            console.error('Error saving print settings:', error);
        }
    }

    // Print Single Receipt
    printReceipt(transactionData) {
        if (!transactionData) {
            console.error('No transaction data provided for printing');
            return;
        }

        const receiptHtml = this.generateReceiptHtml(transactionData);
        this.openPrintWindow(receiptHtml, `Receipt - ${transactionData.transaction_id}`);
    }

    // Print Transaction List
    printTransactionList(transactions, filters = {}) {
        const listHtml = this.generateTransactionListHtml(transactions, filters);
        this.openPrintWindow(listHtml, 'Transaction Report');
    }

    // Generate Receipt HTML
    generateReceiptHtml(transaction) {
        const settings = this.printSettings;
        let html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Payment Receipt - ${transaction.transaction_id}</title>
                <style>
                    body { 
                        margin: 0; 
                        padding: 0; 
                        font-family: ${settings.fontFamily}; 
                        font-size: ${settings.fontSize};
                        line-height: 1.6;
                    }
                    .receipt { 
                        padding: ${settings.margins}; 
                        max-width: 400px; 
                        margin: 0 auto;
                    }
                    .header { 
                        text-align: center; 
                        border-bottom: 2px solid #000; 
                        padding-bottom: 10px; 
                        margin-bottom: 15px; 
                    }
                    .detail { 
                        display: flex; 
                        justify-content: space-between; 
                        margin: 5px 0; 
                    }
                    .amount { 
                        font-size: 18px; 
                        font-weight: bold; 
                    }
                    .footer { 
                        text-align: center; 
                        border-top: 1px solid #000; 
                        padding-top: 10px; 
                        margin-top: 15px; 
                    }
                    @media print { 
                        body { margin: 0; padding: 10px; } 
                    }
                </style>
            </head>
            <body>
                <div class="receipt">
        `;

        // Header
        html += '<div class="header">';
        if (settings.includeLogo) {
            html += `<div style="margin-bottom: 10px;">🚀 BLACK ROCK TERMINAL</div>`;
        }
        html += `<h2 style="margin: 0;">${settings.businessName}</h2>`;
        html += `<div style="font-size: 12px; margin-top: 5px;">${settings.businessAddress.replace(/\n/g, '<br>')}</div>`;
        html += '<h3 style="margin: 10px 0;">PAYMENT RECEIPT</h3>';
        html += '</div>';

        // Transaction Details
        if (settings.showTransactionId) {
            html += `<div class="detail"><span>Transaction ID:</span><span style="font-family: monospace;">${transaction.transaction_id}</span></div>`;
        }
        
        if (settings.showDateTime) {
            html += `<div class="detail"><span>Date/Time:</span><span>${new Date(transaction.created_at || new Date()).toLocaleString()}</span></div>`;
        }
        
        if (settings.showAmount) {
            html += `<div class="detail amount"><span>Amount:</span><span>$${transaction.amount} ${transaction.currency || 'USD'}</span></div>`;
        }
        
        if (settings.showCardInfo && transaction.card_masked) {
            html += `<div class="detail"><span>Card:</span><span style="font-family: monospace;">${transaction.card_masked}</span></div>`;
        }
        
        if (transaction.card_holder_name) {
            html += `<div class="detail"><span>Cardholder:</span><span>${transaction.card_holder_name}</span></div>`;
        }
        
        if (settings.showAuthCode && transaction.auth_code) {
            html += `<div class="detail"><span>Auth Code:</span><span style="font-family: monospace;">${transaction.auth_code}</span></div>`;
        }
        
        if (settings.showProtocol && transaction.protocol) {
            html += `<div class="detail"><span>Protocol:</span><span>${transaction.protocol.split(' (')[0]}</span></div>`;
        }
        
        html += `<div class="detail"><span><strong>Status:</strong></span><span style="color: ${transaction.status === 'approved' ? 'green' : 'red'}; font-weight: bold;">${transaction.status.toUpperCase()}</span></div>`;

        // Footer
        html += '<div class="footer">';
        html += `<p style="margin: 10px 0;">${settings.footerMessage}</p>`;
        html += '<p style="font-size: 12px; color: #666;">Keep this receipt for your records</p>';
        html += '<p style="font-size: 10px; color: #666; margin-top: 10px;">Black Rock Terminal - Secure Payment Processing</p>';
        html += '</div>';

        html += '</div>';
        html += `
                <script>
                    window.onload = function() {
                        window.print();
                        window.onafterprint = function() {
                            window.close();
                        }
                    }
                </script>
            </body>
            </html>
        `;

        return html;
    }

    // Generate Transaction List HTML
    generateTransactionListHtml(transactions, filters) {
        let html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Transaction Report - Black Rock Terminal</title>
                <style>
                    body { 
                        margin: 0; 
                        padding: 20px; 
                        font-family: Arial, sans-serif; 
                    }
                    .header { 
                        text-align: center; 
                        margin-bottom: 30px; 
                    }
                    .summary { 
                        margin-bottom: 20px; 
                    }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                    }
                    th, td { 
                        border: 1px solid #ccc; 
                        padding: 8px; 
                        text-align: left; 
                    }
                    th { 
                        background-color: #f5f5f5; 
                        font-weight: bold; 
                    }
                    .approved { 
                        color: green; 
                        font-weight: bold; 
                    }
                    .declined { 
                        color: red; 
                        font-weight: bold; 
                    }
                    .footer { 
                        margin-top: 30px; 
                        text-align: center; 
                        font-size: 12px; 
                        color: #666; 
                    }
                    @media print { 
                        body { margin: 0; padding: 15px; } 
                    }
                </style>
            </head>
            <body>
        `;

        // Header
        html += `
            <div class="header">
                <h1>BLACK ROCK TERMINAL</h1>
                <h2>Transaction Report</h2>
                <p>Generated on: ${new Date().toLocaleString()}</p>
            </div>
        `;

        // Summary
        html += `
            <div class="summary">
                <h3>Report Summary</h3>
                <p><strong>Total Transactions:</strong> ${transactions.length}</p>
                <p><strong>Date Range:</strong> ${filters.start_date || 'All'} to ${filters.end_date || 'All'}</p>
                <p><strong>Status Filter:</strong> ${filters.status || 'All'}</p>
            </div>
        `;

        // Table
        html += `
            <table>
                <thead>
                    <tr>
                        <th>Transaction ID</th>
                        <th>Date/Time</th>
                        <th>Amount</th>
                        <th>Card</th>
                        <th>Cardholder</th>
                        <th>Status</th>
                        <th>Payout Status</th>
                    </tr>
                </thead>
                <tbody>
        `;

        transactions.forEach(transaction => {
            html += `
                <tr>
                    <td style="font-family: monospace;">${transaction.transaction_id}</td>
                    <td>${new Date(transaction.created_at).toLocaleString()}</td>
                    <td><strong>$${transaction.amount} ${transaction.currency}</strong></td>
                    <td style="font-family: monospace;">${transaction.card_masked || 'N/A'}</td>
                    <td>${transaction.card_holder_name || 'N/A'}</td>
                    <td class="${transaction.status}">${transaction.status.toUpperCase()}</td>
                    <td>${transaction.payout_status.toUpperCase()}</td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;

        // Footer
        html += `
            <div class="footer">
                <p>Black Rock Terminal - Confidential Transaction Report</p>
                <p>This report contains sensitive payment information</p>
                <p>Generated by: ${this.printSettings.businessName}</p>
            </div>
        `;

        html += `
                <script>
                    window.onload = function() {
                        window.print();
                        window.onafterprint = function() {
                            window.close();
                        }
                    }
                </script>
            </body>
            </html>
        `;

        return html;
    }

    // Open Print Window
    openPrintWindow(content, title = 'Print') {
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (printWindow) {
            printWindow.document.write(content);
            printWindow.document.close();
        } else {
            // Fallback if popup is blocked
            const blob = new Blob([content], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${title.replace(/\s+/g, '_')}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }

    // Print Current Transaction
    printCurrentTransaction() {
        if (window.currentTransaction) {
            this.printReceipt(window.currentTransaction);
        } else {
            BlackRockTerminal.showNotification('No transaction to print', 'warning');
        }
    }

    // Print Page
    printPage() {
        window.print();
    }

    // Generate PDF (using browser's print to PDF)
    generatePDF() {
        if (window.BlackRockTerminal) {
            BlackRockTerminal.showNotification('Use browser\'s Print function and select "Save as PDF"', 'info', 8000);
        }
        window.print();
    }
}

// Initialize Print Manager
const blackRockPrint = new BlackRockPrint();

// Export for global use
window.BlackRockPrint = blackRockPrint;

// Global Print Functions
window.printReceipt = function() {
    blackRockPrint.printCurrentTransaction();
};

window.printTransactions = function() {
    const transactions = window.currentTransactions || [];
    blackRockPrint.printTransactionList(transactions);
};

window.printPage = function() {
    blackRockPrint.printPage();
};