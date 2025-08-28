import Calendar from "@toast-ui/calendar";





    const cal = new Calendar('#calendar', {
      defaultView: 'month',
      isReadOnly: true,
      timezone: { zones: [{ timezoneName: 'America/Toronto' }] },
      usageStatistics: false
    });


self.cal = cal;

console.log('patate');