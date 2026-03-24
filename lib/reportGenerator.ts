export function generateCSVReport(project: any, tasks: any[]): string {
  const headers = ['Phase', 'Requirement', 'Vendor', 'Bid Amount', 'Payment Status', 'Amount Paid', 'Amount Outstanding'];

  const rows = tasks.map(task => {
    const acceptedBid = task.bids?.find((b: any) => b.status === 'accepted');
    return [
      task.phase?.name || 'Unassigned',
      task.title,
      acceptedBid?.vendor?.name || 'No vendor',
      acceptedBid?.amount || 0,
      acceptedBid?.paymentStatus || 'N/A',
      acceptedBid?.amountPaid || 0,
      acceptedBid ? (acceptedBid.amount - (acceptedBid.amountPaid || 0)) : 0,
    ];
  });

  const totalBid = tasks.reduce((sum, task) => {
    const bid = task.bids?.find((b: any) => b.status === 'accepted');
    return sum + (bid?.amount || 0);
  }, 0);

  const totalPaid = tasks.reduce((sum, task) => {
    const bid = task.bids?.find((b: any) => b.status === 'accepted');
    return sum + (bid?.amountPaid || 0);
  }, 0);

  rows.push([]);
  rows.push(['', '', 'TOTAL', totalBid, '', totalPaid, totalBid - totalPaid]);

  const csvContent = [
    `Project Cost Report: ${project.name}`,
    `Generated: ${new Date().toLocaleDateString()}`,
    `Budget: ${project.budget ? '$' + project.budget.toLocaleString() : 'Not set'}`,
    '',
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
