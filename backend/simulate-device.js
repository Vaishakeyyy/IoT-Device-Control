import multicastdns from 'multicast-dns';
const mdns = multicastdns();

const DEVICE_IP = '192.168.137.99'; // Simulated device IP on the hotspot subnet
const HOSTNAME = 'living-room-speaker.local';
const SERVICE_NAME = 'Living-Room-Speaker._googlecast._tcp.local';

console.log('=====================================================');
console.log('    ROBROS Telemetry Smart Device Simulator          ');
console.log('=====================================================');
console.log(`IP Assigned:   ${DEVICE_IP}`);
console.log(`Hostname:      ${HOSTNAME}`);
console.log(`Service Name:  ${SERVICE_NAME}`);
console.log('-----------------------------------------------------');
console.log('Active & listening for mDNS discovery query scans...\n');

mdns.on('query', (packet) => {
  const isTarget = packet.questions.some(q => 
    q.name === '_services._dns-sd._udp.local' || 
    q.name === '_googlecast._tcp.local' || 
    q.name === '_googlecast._tcp' ||
    q.name.includes('_googlecast')
  );
  
  if (isTarget) {
    console.log(`[mDNS Request Received] Sending broadcast payload for: ${HOSTNAME}`);
    
    mdns.respond({
      answers: [
        {
          name: '_googlecast._tcp.local',
          type: 'PTR',
          data: SERVICE_NAME
        },
        {
          name: SERVICE_NAME,
          type: 'SRV',
          data: {
            port: 8009,
            weight: 0,
            priority: 0,
            target: HOSTNAME
          }
        },
        {
          name: HOSTNAME,
          type: 'A',
          ttl: 120,
          data: DEVICE_IP
        }
      ],
      additionals: [
        {
          name: SERVICE_NAME,
          type: 'TXT',
          data: ['fn=Living Room Speaker', 'md=Google Nest Audio', 'ca=4101']
        }
      ]
    });
  }
});
