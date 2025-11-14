const detailView = {
  show: function(config) {
    const modalId = 'detailViewModal';
    let modalElement = document.getElementById(modalId);
    
    if (!modalElement) {
      modalElement = this.createModal(modalId);
      document.body.appendChild(modalElement);
    }
    
    this.populateModal(modalId, config);
    
    const modal = new bootstrap.Modal(document.getElementById(modalId));
    modal.show();
  },

  createModal: function(modalId) {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = modalId;
    modal.setAttribute('tabindex', '-1');
    modal.setAttribute('aria-labelledby', `${modalId}Label`);
    modal.setAttribute('aria-hidden', 'true');
    
    modal.innerHTML = `
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="${modalId}Label">Detail View</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body" id="${modalId}Body">
            <!-- Content will be populated here -->
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    `;
    
    return modal;
  },

  populateModal: function(modalId, config) {
    const titleElement = document.getElementById(`${modalId}Label`);
    const bodyElement = document.getElementById(`${modalId}Body`);
    
    if (titleElement) {
      titleElement.textContent = config.title || 'Detail View';
    }
    
    if (bodyElement) {
      let html = '';
      
      if (config.sections && config.sections.length > 0) {
        html += '<div class="detail-sections mb-4">';
        config.sections.forEach(section => {
          html += this.renderSection(section);
        });
        html += '</div>';
      }
      
      if (config.subItems && config.subItems.length > 0) {
        html += '<div class="sub-items-sections">';
        config.subItems.forEach(subItemSection => {
          html += this.renderSubItemSection(subItemSection);
        });
        html += '</div>';
      }
      
      bodyElement.innerHTML = html;
    }
  },

  renderSection: function(section) {
    if (!section.items || section.items.length === 0) {
      return '';
    }
    
    let html = '<div class="detail-section mb-3">';
    if (section.title) {
      html += `<h6 class="detail-section-title mb-3">${this.escapeHtml(section.title)}</h6>`;
    }
    
    html += '<div class="detail-items">';
    section.items.forEach(item => {
      html += this.renderDetailItem(item);
    });
    html += '</div>';
    
    html += '</div>';
    return html;
  },

  renderDetailItem: function(item) {
    const label = item.label || '';
    const value = item.value !== undefined && item.value !== null ? item.value : '<span class="text-muted">Not set</span>';
    
    return `
      <div class="detail-item mb-2">
        <div class="row">
          <div class="col-md-4">
            ${this.escapeHtml(label)}:
          </div>
          <div class="col-md-8">
            ${typeof value === 'string' ? value : this.escapeHtml(String(value))}
          </div>
        </div>
      </div>
    `;
  },

  renderSubItemSection: function(subItemSection) {
    if (!subItemSection.items || subItemSection.items.length === 0) {
      return `
        <div class="sub-item-section mb-4">
          <h6 class="sub-item-section-title mb-3">${this.escapeHtml(subItemSection.title || 'Related Items')}</h6>
          <p class="text-muted">No ${this.escapeHtml(subItemSection.title || 'items')} found.</p>
        </div>
      `;
    }
    
    let html = '<div class="sub-item-section mb-4">';
    
    if (subItemSection.title) {
      html += `<h6 class="sub-item-section-title mb-3">${this.escapeHtml(subItemSection.title)} (${subItemSection.items.length})</h6>`;
    }
    
    html += '<div class="table-responsive">';
    html += '<table class="table table-sm table-hover align-middle">';
    
    if (subItemSection.columns && subItemSection.columns.length > 0) {
      html += '<thead><tr>';
      subItemSection.columns.forEach(column => {
        html += `<th>${this.escapeHtml(column)}</th>`;
      });
      html += '</tr></thead>';
    }
    
    html += '<tbody>';
    subItemSection.items.forEach(item => {
      html += '<tr>';
      if (subItemSection.columns && subItemSection.columns.length > 0) {
        subItemSection.columns.forEach(column => {
          const key1 = column.toLowerCase().replace(/\s+/g, '');
          const key2 = column;
          const key3 = column.toLowerCase().replace(/\s+/g, '-');
          const key4 = column.toLowerCase();
          const value = item[key1] !== undefined ? item[key1] 
            : item[key2] !== undefined ? item[key2]
            : item[key3] !== undefined ? item[key3]
            : item[key4] !== undefined ? item[key4]
            : '';
          html += `<td>${typeof value === 'string' ? value : this.escapeHtml(String(value))}</td>`;
        });
      } else {
        html += '<td>';
        Object.keys(item).forEach(key => {
          const value = item[key];
          if (value !== undefined && value !== null) {
            html += `<strong>${this.escapeHtml(key)}:</strong> ${typeof value === 'string' ? value : this.escapeHtml(String(value))}<br>`;
          }
        });
        html += '</td>';
      }
      html += '</tr>';
    });
    html += '</tbody>';
    
    html += '</table>';
    html += '</div>';
    html += '</div>';
    
    return html;
  },

  escapeHtml: function(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

