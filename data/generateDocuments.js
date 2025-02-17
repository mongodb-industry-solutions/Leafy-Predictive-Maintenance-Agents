
const fs = require('fs');

function generateManualsAndWorkOrders() {
  const manuals = [
    {
      id: 'manual_1',
      type: 'manual',
      content: 'Manual 1: Instructions on maintaining optimal spindle speed to reduce vibration and prevent tool wear.',
    },
    {
      id: 'manual_2',
      type: 'manual',
      content: 'Manual 2: Guidelines for calibrating feed rate and temperature settings to improve surface finish.',
    },
    {
      id: 'manual_3',
      type: 'manual',
      content: 'Manual 3: Troubleshooting steps for addressing unexpected increases in wear rate and dimensional inaccuracies.',
    },
  ];

  const workOrders = [
    {
      id: 'workorder_1',
      type: 'work_order',
      content: 'Work Order 1: Adjust spindle speed to 1200 RPM due to observed high vibration levels.',
    },
    {
      id: 'workorder_2',
      type: 'work_order',
      content: 'Work Order 2: Replace cutting tool due to excessive wear detected during routine inspection.',
    },
    {
      id: 'workorder_3',
      type: 'work_order',
      content: 'Work Order 3: Recalibrate machine settings to address surface finish quality issues.',
    },
  ];

  const documents = [...manuals, ...workOrders];
  fs.writeFileSync('data/documents.json', JSON.stringify(documents, null, 2));
}

generateManualsAndWorkOrders();
