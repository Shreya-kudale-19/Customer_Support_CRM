// State Management
let currentTickets = [];
let currentFilter = 'All'; // 'All', 'Open', 'In Progress', 'Closed'
let currentSearch = '';
let activeTicketId = null; // Currently viewed ticket ID

// Base URL for endpoints
const API_BASE = '/api';

// Live Time Indicator
function updateLiveTime() {
    const timeEl = document.getElementById('current-time');
    if (timeEl) {
        const now = new Date();
        timeEl.textContent = 'UTC ' + now.toISOString().replace('T', ' ').substring(0, 19);
    }
}
setInterval(updateLiveTime, 1000);
updateLiveTime();

// ----------------- TOAST SYSTEM -----------------
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `flex items-center gap-3 p-4 rounded-xl border shadow-xl bg-zinc-900 transition-all duration-300 transform translate-y-2 opacity-0 pointer-events-auto max-w-sm w-full`;
    
    // Set border and color based on type
    if (type === 'success') {
        toast.className += ' border-emerald-500/20 text-emerald-400';
        toast.innerHTML = `
            <svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span class="text-sm font-medium text-zinc-200">${message}</span>
        `;
    } else {
        toast.className += ' border-red-500/20 text-red-400';
        toast.innerHTML = `
            <svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <span class="text-sm font-medium text-zinc-200">${message}</span>
        `;
    }

    container.appendChild(toast);
    
    // Force reflow and slide-in
    setTimeout(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

    // Slide-out and remove
    setTimeout(() => {
        toast.classList.add('translate-y-2', 'opacity-0');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3500);
}

// ----------------- API CONSUMERS -----------------

// Fetch tickets based on state filter and search keyword
async function fetchTickets() {
    const loadingState = document.getElementById('loading-state');
    const emptyState = document.getElementById('empty-state');
    const tbody = document.getElementById('tickets-tbody');
    const mobileList = document.getElementById('tickets-mobile-list');

    try {
        // 1. Build Query Parameters
        const params = new URLSearchParams();
        if (currentFilter !== 'All') {
            params.append('status', currentFilter);
        }
        if (currentSearch.trim() !== '') {
            params.append('search', currentSearch.trim());
        }

        // 2. Fetch API
        const response = await fetch(`${API_BASE}/tickets?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to retrieve tickets.');
        
        currentTickets = await response.ok ? await response.json() : [];
        
        // Hide loader
        if (loadingState) loadingState.classList.add('hidden');

        // 3. Update Dashboard Stats (We query the full list counts by fetching everything without query filters)
        updateStats();

        // 4. Check if empty
        if (currentTickets.length === 0) {
            tbody.innerHTML = '';
            mobileList.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');
        
        // 5. Render list views
        renderDesktopTable(currentTickets);
        renderMobileCards(currentTickets);

    } catch (error) {
        console.error(error);
        if (loadingState) loadingState.classList.add('hidden');
        showToast('Error loading tickets. Please check server.', 'error');
    }
}

// Separate function to calculate stat card numbers based on global API count
async function updateStats() {
    try {
        // Query server for ALL tickets to calculate metrics aggregates accurately
        const response = await fetch(`${API_BASE}/tickets`);
        if (!response.ok) return;
        const allTickets = await response.json();

        let openCount = 0;
        let progressCount = 0;
        let closedCount = 0;

        allTickets.forEach(ticket => {
            if (ticket.status === 'Open') openCount++;
            else if (ticket.status === 'In Progress') progressCount++;
            else if (ticket.status === 'Closed') closedCount++;
        });

        document.getElementById('stat-total').textContent = allTickets.length;
        document.getElementById('stat-open').textContent = openCount;
        document.getElementById('stat-progress').textContent = progressCount;
        document.getElementById('stat-closed').textContent = closedCount;
    } catch (e) {
        console.error("Stats aggregation failed", e);
    }
}

// ----------------- RENDER ENGINE -----------------

// Populate Desktop Table Rows
function renderDesktopTable(tickets) {
    const tbody = document.getElementById('tickets-tbody');
    tbody.innerHTML = '';

    tickets.forEach(ticket => {
        const formattedDate = formatDate(ticket.created_at);
        const statusBadge = getStatusBadge(ticket.status);

        const tr = document.createElement('tr');
        tr.className = 'border-b border-zinc-800/40 hover:bg-zinc-900/25 transition-colors cursor-pointer group';
        tr.onclick = () => openTicketDetail(ticket.ticket_id);
        
        tr.innerHTML = `
            <td class="px-6 py-4 font-mono text-xs font-bold text-violet-400">${ticket.ticket_id}</td>
            <td class="px-6 py-4 font-medium text-zinc-100">${escapeHTML(ticket.customer_name)}</td>
            <td class="px-6 py-4 max-w-xs truncate text-zinc-300">${escapeHTML(ticket.subject)}</td>
            <td class="px-6 py-4">${statusBadge}</td>
            <td class="px-6 py-4 text-xs text-zinc-500">${formattedDate}</td>
            <td class="px-6 py-4 text-right">
                <button class="inline-flex items-center gap-1 text-xs font-semibold text-zinc-400 group-hover:text-violet-400 transition-colors">
                    View
                    <svg class="h-3 w-3 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" /></svg>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Populate Mobile Cards List
function renderMobileCards(tickets) {
    const list = document.getElementById('tickets-mobile-list');
    list.innerHTML = '';

    tickets.forEach(ticket => {
        const formattedDate = formatDate(ticket.created_at);
        const statusBadge = getStatusBadge(ticket.status);

        const div = document.createElement('div');
        div.className = 'p-4 active:bg-zinc-900 transition-colors cursor-pointer space-y-2';
        div.onclick = () => openTicketDetail(ticket.ticket_id);

        div.innerHTML = `
            <div class="flex items-center justify-between">
                <span class="font-mono text-xs font-bold text-violet-400">${ticket.ticket_id}</span>
                ${statusBadge}
            </div>
            <div>
                <h4 class="font-semibold text-zinc-200 text-sm truncate">${escapeHTML(ticket.subject)}</h4>
                <p class="text-xs text-zinc-400 mt-0.5">${escapeHTML(ticket.customer_name)}</p>
            </div>
            <div class="text-[10px] text-zinc-500 flex justify-between items-center pt-1">
                <span>Created: ${formattedDate}</span>
                <span class="text-violet-400 font-semibold">Tap to view &rarr;</span>
            </div>
        `;
        list.appendChild(div);
    });
}

// ----------------- ACTIONS & SUBMISSIONS -----------------

// Create a new support ticket
async function submitNewTicket(event) {
    event.preventDefault();

    const name = document.getElementById('form-name').value;
    const email = document.getElementById('form-email').value;
    const subject = document.getElementById('form-subject').value;
    const description = document.getElementById('form-description').value;

    try {
        const response = await fetch(`${API_BASE}/tickets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customer_name: name,
                customer_email: email,
                subject: subject,
                description: description
            })
        });

        if (!response.ok) throw new Error('Could not submit ticket.');

        const result = await response.json();
        
        // Reset form, Close Modal, Toast Success, Refresh data
        document.getElementById('create-ticket-form').reset();
        toggleCreateModal(false);
        showToast(`Ticket ${result.ticket_id} created successfully!`);
        fetchTickets();

    } catch (error) {
        console.error(error);
        showToast('Error creating ticket. Please verify details.', 'error');
    }
}

// View details of a specific ticket in the drawer
async function openTicketDetail(ticketId) {
    try {
        const response = await fetch(`${API_BASE}/tickets/${ticketId}`);
        if (!response.ok) throw new Error('Failed to fetch ticket details.');

        const ticket = await response.json();
        activeTicketId = ticket.ticket_id;

        // Set metadata fields in Drawer
        document.getElementById('drawer-ticket-id').textContent = ticket.ticket_id;
        document.getElementById('drawer-name').textContent = ticket.customer_name;
        document.getElementById('drawer-email').textContent = ticket.customer_email;
        document.getElementById('drawer-email').href = `mailto:${ticket.customer_email}`;
        document.getElementById('drawer-subject').textContent = ticket.subject;
        document.getElementById('drawer-description').textContent = ticket.description || 'No description provided.';
        document.getElementById('drawer-notes-count').textContent = ticket.notes.length;

        // Select correct option in status dropdown
        const statusSelect = document.getElementById('drawer-status-select');
        statusSelect.value = ticket.status;

        // Render notes timeline
        renderNotesTimeline(ticket.notes);

        // Open Side Drawer
        toggleDetailDrawer(true);

    } catch (error) {
        console.error(error);
        showToast('Failed to load ticket details.', 'error');
    }
}

// Render Notes action list
function renderNotesTimeline(notes) {
    const timeline = document.getElementById('drawer-notes-timeline');
    timeline.innerHTML = '';

    if (notes.length === 0) {
        timeline.innerHTML = `
            <div class="text-zinc-600 text-xs py-2 italic text-center w-full">
                No history or comments recorded yet.
            </div>
        `;
        return;
    }

    // Render chronological list (newest comments at the bottom is standard for chats)
    notes.forEach(note => {
        const formattedDate = formatDate(note.created_at);

        const card = document.createElement('div');
        card.className = 'relative pl-8 flex gap-3 text-xs';
        
        // Custom vertical node point
        card.innerHTML = `
            <div class="absolute left-[9px] top-1 flex h-2 w-2 items-center justify-center rounded-full bg-violet-500 ring-4 ring-zinc-900"></div>
            <div class="flex-1 rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
                <div class="flex items-center justify-between text-zinc-500 mb-1">
                    <span class="font-semibold text-zinc-300">Staff Note / System Action</span>
                    <span class="text-[10px]">${formattedDate}</span>
                </div>
                <p class="text-zinc-300 leading-relaxed font-sans whitespace-pre-wrap">${escapeHTML(note.note_text)}</p>
            </div>
        `;
        timeline.appendChild(card);
    });

    // Auto-scroll timeline to bottom to view newest comments
    setTimeout(() => {
        timeline.scrollTop = timeline.scrollHeight;
    }, 50);
}

// Update ticket status from details panel select
async function handleStatusChange() {
    const newStatus = document.getElementById('drawer-status-select').value;
    if (!activeTicketId) return;

    try {
        const response = await fetch(`${API_BASE}/tickets/${activeTicketId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: newStatus
            })
        });

        if (!response.ok) throw new Error('Status change failed.');
        
        showToast(`Status updated to: ${newStatus}`);
        fetchTickets(); // Refresh background list

    } catch (error) {
        console.error(error);
        showToast('Error updating status.', 'error');
    }
}

// Add a note / comment inside detail panel
async function submitNote(event) {
    event.preventDefault();
    const noteInput = document.getElementById('note-input');
    const noteText = noteInput.value.trim();

    if (!activeTicketId || noteText === '') return;

    try {
        const response = await fetch(`${API_BASE}/tickets/${activeTicketId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                notes: noteText
            })
        });

        if (!response.ok) throw new Error('Failed to save comment.');

        // Reset input, show toast and refresh drawer details
        noteInput.value = '';
        showToast('Comment added successfully!');
        openTicketDetail(activeTicketId); // Refreshes notes list
        
    } catch (error) {
        console.error(error);
        showToast('Error adding comment.', 'error');
    }
}

// ----------------- UI CONTROLLERS -----------------

// Toggle create ticket modal and animate
function toggleCreateModal(show) {
    const modal = document.getElementById('create-modal');
    if (!modal) return;

    const dialog = modal.querySelector('.glass-panel');

    if (show) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            dialog.classList.remove('scale-95');
            dialog.classList.add('scale-100');
        }, 15);
    } else {
        modal.classList.add('opacity-0');
        dialog.classList.remove('scale-100');
        dialog.classList.add('scale-95');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }, 300);
    }
}

// Toggle slide-out ticket details panel
function toggleDetailDrawer(show) {
    const drawer = document.getElementById('detail-drawer');
    if (!drawer) return;

    const panel = drawer.querySelector('.absolute.right-0');

    if (show) {
        drawer.classList.remove('hidden');
        setTimeout(() => {
            drawer.classList.remove('opacity-0');
            panel.classList.remove('translate-x-full');
            panel.classList.add('translate-x-0');
        }, 15);
    } else {
        drawer.classList.add('opacity-0');
        panel.classList.remove('translate-x-0');
        panel.classList.add('translate-x-full');
        setTimeout(() => {
            drawer.classList.add('hidden');
            activeTicketId = null; // Unset active ID
        }, 300);
    }
}

// Set active status filter and adjust UI buttons
function setFilter(status) {
    currentFilter = status;
    const filterButtons = {
        'All': document.getElementById('filter-all'),
        'Open': document.getElementById('filter-open'),
        'In Progress': document.getElementById('filter-progress'),
        'Closed': document.getElementById('filter-closed')
    };

    // Reset styles
    Object.values(filterButtons).forEach(btn => {
        if (!btn) return;
        btn.className = "rounded-md px-3 py-1 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-all";
    });

    // Apply active violet style to selected button
    const activeBtn = filterButtons[status];
    if (activeBtn) {
        activeBtn.className = "rounded-md px-3 py-1 text-xs font-semibold bg-violet-600 text-white shadow-sm transition-all duration-200";
    }

    fetchTickets();
}

// Search box listener with simple debounce (instant feedback on type)
let searchTimeout;
document.getElementById('search-input').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    currentSearch = e.target.value;
    
    // Fetch results after user stops typing for 180ms (debounce)
    searchTimeout = setTimeout(() => {
        fetchTickets();
    }, 180);
});

// Close modals on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        toggleCreateModal(false);
        toggleDetailDrawer(false);
    }
});

// ----------------- HELPERS -----------------

// Helper to escape HTML tags to prevent XSS (Cross-Site Scripting)
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// Helper to map status strings to beautiful colored badges
function getStatusBadge(status) {
    switch (status) {
        case 'Open':
            return `<span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20"><span class="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>Open</span>`;
        case 'In Progress':
            return `<span class="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-400 border border-amber-500/20"><span class="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse"></span>In Progress</span>`;
        case 'Closed':
            return `<span class="inline-flex items-center gap-1.5 rounded-full bg-zinc-800 px-2 py-1 text-xs font-semibold text-zinc-400 border border-zinc-700">Closed</span>`;
        default:
            return `<span class="inline-flex items-center rounded-full bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-400">${status}</span>`;
    }
}

// Format UTC timestamps to clean human readable dates
function formatDate(dateString) {
    if (!dateString) return '';
    
    // Handle timezone parsing safely
    const date = new Date(dateString + 'Z'); 
    if (isNaN(date.getTime())) {
        return dateString;
    }
    
    return date.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// Init Load
window.addEventListener('DOMContentLoaded', () => {
    fetchTickets();
});
