module.exports = {
  pdf_options: {
    format: 'A4',
    margin: {
      top: '20mm',
      right: '15mm',
      bottom: '20mm',
      left: '15mm'
    },
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%; color: #666;">Nepal Visual - Voter List Management Platform</div>',
    footerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%; color: #666;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>'
  },
  stylesheet: null,
  body_class: 'markdown-body',
  marked_options: {
    headerIds: false,
    mangle: false
  }
};

