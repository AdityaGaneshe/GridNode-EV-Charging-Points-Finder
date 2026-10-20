/* Starting data. Edit freely; "Reset demo data" in the footer restores this. */
window.GridNodeSeed = {
  host: { name: 'Vikram Gokhale', earnings: 1420 },
  wallet: 2450,
  stations: [
    { id:'ST-1', name:'Bandra West Driveway', host:'Vikram Gokhale', mine:true, area:'Bandra West', lat:19.0658, lng:72.8296, connector:'Type 2 AC', kw:7.4, rate:15.5, notes:'Next to gate B2. 5 m cable provided. Tell the guard you are arriving.',
      slots:[{id:'S1',day:'Today',start:'18:30',hours:4,rate:16,status:'OPEN'},{id:'S2',day:'Tomorrow',start:'06:30',hours:4,rate:14.5,status:'OPEN'}] },
    { id:'ST-2', name:'BKC G-Block Fast Hub', host:'GridNode Public', area:'Bandra Kurla Complex', lat:19.0688, lng:72.8683, connector:'CCS2 DC', kw:60, rate:19, notes:'Basement ramp B1. Boom barrier reads your booked plate.',
      slots:[{id:'S3',day:'Today',start:'12:00',hours:4,rate:17.5,status:'OPEN'},{id:'S4',day:'Today',start:'18:00',hours:5,rate:19,status:'OPEN'}] },
    { id:'ST-3', name:'Worli Seaface Bay 9', host:'Meera Kulkarni', area:'Worli', lat:19.0176, lng:72.8152, connector:'16A 3-Pin Industrial', kw:3.3, rate:12.5, notes:'Visitor bay 9 inside the main gate. Suits scooters and small hatchbacks.',
      slots:[{id:'S5',day:'Today',start:'11:00',hours:5,rate:12.5,status:'OPEN'},{id:'S6',day:'Tomorrow',start:'00:00',hours:6,rate:11.5,status:'OPEN'}] },
    { id:'ST-4', name:'Lonavala Food Mall Bay 1', host:'Expressway Grid', area:'Expressway km 64', lat:18.7542, lng:73.4068, connector:'CCS2 DC', kw:120, rate:21.5, notes:'Pull-through bay on the Mumbai–Pune Expressway. Backup transformer on site.',
      slots:[{id:'S7',day:'Today',start:'06:00',hours:6,rate:21.5,status:'OPEN'}] },
    { id:'ST-5', name:'Khandala Villa Compound', host:'Sanjay Patil', area:'Khandala Ghat', lat:18.7615, lng:73.3792, connector:'Type 2 AC', kw:11, rate:14.5, notes:'300 m off the old highway near the ghat crest. Good fallback when highway DC queues are full.',
      slots:[{id:'S8',day:'Today',start:'13:00',hours:4,rate:13.5,status:'OPEN'}] },
    { id:'ST-6', name:'Koregaon Park Lane 5', host:'Aarti Shinde', area:'Koregaon Park, Pune', lat:18.5362, lng:73.894, connector:'Type 2 AC', kw:7.4, rate:14, notes:'Shaded porch bay with CCTV. Enter your PIN at the gate box.',
      slots:[{id:'S9',day:'Today',start:'09:00',hours:6,rate:13,status:'OPEN'},{id:'S10',day:'Today',start:'18:00',hours:4,rate:14,status:'OPEN'}] }
  ],
  bookings: []
};
