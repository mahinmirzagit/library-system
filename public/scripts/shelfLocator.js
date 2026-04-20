/**
 * Smart Shelf-Locator Component
 * Visualizes alphanumeric coordinates (e.g., A1-B2) on a shelf grid.
 */

function renderShelfLocator(containerId, coordinate) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Clear and build initial structure
    container.innerHTML = `
        <div class="shelf-locator">
            <span class="shelf-title">Physical Location Locator</span>
            <div class="shelf-info">
                <span class="shelf-label">Coordinate Selected</span>
                ${coordinate || "N/A"}
            </div>
            <div class="shelf-visual" id="shelf-visual-grid"></div>
        </div>
    `;

    const grid = document.getElementById("shelf-visual-grid");
    if (!coordinate) return;

    // Parse coordinate (A1-B2 format)
    // For now, we simulate a 5x5 grid and highlight cells based on the coordinate segments
    const rows = ['A', 'B', 'C', 'D', 'E'];
    
    for (let i = 0; i < 25; i++) {
        const rowIdx = Math.floor(i / 5);
        const colIdx = (i % 5) + 1;
        const cellId = `${rows[rowIdx]}${colIdx}`;
        
        const cell = document.createElement("div");
        cell.className = "shelf-cell";
        cell.textContent = cellId;
        
        // Highlight if it matches part of the coordinate
        if (coordinate.includes(cellId)) {
            cell.classList.add("active");
        }
        
        grid.appendChild(cell);
    }
}

// Export to window
window.renderShelfLocator = renderShelfLocator;
