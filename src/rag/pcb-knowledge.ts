/**
 * PCB Knowledge Base
 * Pre-built knowledge for PCB design assistance
 */

export interface ComponentInfo {
  type: string;
  description: string;
  commonValues: string[];
  pinouts: Record<string, string[]>;
  applications: string[];
  keywords: string[];
}

export interface CircuitPattern {
  name: string;
  description: string;
  components: string[];
  connections: string[];
  applications: string[];
}

/**
 * Common electronic component knowledge
 */
export const componentKnowledge: ComponentInfo[] = [
  {
    type: 'resistor',
    description: 'Passive component that limits current flow',
    commonValues: ['100Ω', '1kΩ', '10kΩ', '100kΩ', '1MΩ', '4.7kΩ', '2.2kΩ'],
    pinouts: {
      standard: ['PIN1', 'PIN2'],
    },
    applications: ['Current limiting', 'Voltage dividers', 'Pull-up/pull-down', 'LED current limiting'],
    keywords: ['resistance', 'ohm', 'current limit', 'pull-up', 'pull-down'],
  },
  {
    type: 'capacitor',
    description: 'Stores electrical energy in an electric field',
    commonValues: ['100nF', '1µF', '10µF', '100µF', '1000µF', '22pF', '10pF'],
    pinouts: {
      polarized: ['POSITIVE', 'NEGATIVE'],
      nonPolarized: ['PIN1', 'PIN2'],
    },
    applications: ['Decoupling', 'Filtering', 'Timing circuits', 'Energy storage'],
    keywords: ['capacitance', 'farad', 'decoupling', 'bypass', 'filter'],
  },
  {
    type: 'led',
    description: 'Light-emitting diode that produces light when current flows',
    commonValues: ['Red', 'Green', 'Blue', 'White', 'Yellow', 'RGB'],
    pinouts: {
      standard: ['ANODE', 'CATHODE'],
      rgb: ['RED', 'GREEN', 'BLUE', 'COMMON'],
    },
    applications: ['Indicators', 'Displays', 'Lighting', 'Status indication'],
    keywords: ['light', 'indicator', 'display', 'illumination'],
  },
  {
    type: 'voltage_regulator',
    description: 'Maintains constant output voltage regardless of input variations',
    commonValues: ['3.3V', '5V', '12V', '1.8V', 'Adjustable'],
    pinouts: {
      linear: ['VIN', 'GND', 'VOUT'],
      adjustable: ['VIN', 'GND', 'VOUT', 'ADJ'],
    },
    applications: ['Power supply', 'Voltage conversion', 'Load regulation'],
    keywords: ['power', 'regulation', 'LDO', '7805', 'AMS1117'],
  },
  {
    type: 'microcontroller',
    description: 'Programmable integrated circuit for embedded applications',
    commonValues: ['ATmega328', 'ESP32', 'STM32', 'RP2040', 'ATtiny85'],
    pinouts: {
      esp32: ['VCC', 'GND', 'EN', 'IO0-IO39', 'TX', 'RX'],
      atmega328: ['VCC', 'GND', 'RESET', 'XTAL1', 'XTAL2', 'PB0-PB7', 'PC0-PC6', 'PD0-PD7'],
    },
    applications: ['Control systems', 'IoT devices', 'Automation', 'Sensor interfaces'],
    keywords: ['MCU', 'processor', 'embedded', 'arduino', 'programmable'],
  },
  {
    type: 'transistor',
    description: 'Semiconductor device for switching or amplification',
    commonValues: ['2N2222', 'BC547', 'IRF540', '2N7000', 'TIP120'],
    pinouts: {
      bjt: ['BASE', 'COLLECTOR', 'EMITTER'],
      mosfet: ['GATE', 'DRAIN', 'SOURCE'],
    },
    applications: ['Switching', 'Amplification', 'Motor drivers', 'Level shifting'],
    keywords: ['switch', 'amplifier', 'BJT', 'MOSFET', 'NPN', 'PNP'],
  },
  {
    type: 'diode',
    description: 'Allows current flow in one direction only',
    commonValues: ['1N4148', '1N4007', '1N5819', 'Zener 5.1V'],
    pinouts: {
      standard: ['ANODE', 'CATHODE'],
    },
    applications: ['Rectification', 'Protection', 'Voltage clamping', 'Reverse polarity protection'],
    keywords: ['rectifier', 'protection', 'schottky', 'zener'],
  },
  {
    type: 'inductor',
    description: 'Stores energy in a magnetic field',
    commonValues: ['10µH', '100µH', '1mH', '10mH', '4.7µH'],
    pinouts: {
      standard: ['PIN1', 'PIN2'],
    },
    applications: ['Filtering', 'DC-DC converters', 'EMI suppression', 'Energy storage'],
    keywords: ['inductance', 'henry', 'choke', 'filter', 'buck', 'boost'],
  },
];

/**
 * Common circuit patterns
 */
export const circuitPatterns: CircuitPattern[] = [
  {
    name: 'LED with Current Limiting Resistor',
    description: 'Basic LED circuit with appropriate current limiting',
    components: ['LED', 'Resistor (330Ω for 5V, 100Ω for 3.3V)'],
    connections: ['VCC -> Resistor -> LED Anode', 'LED Cathode -> GND'],
    applications: ['Status indicators', 'Simple displays'],
  },
  {
    name: 'Voltage Divider',
    description: 'Two resistors creating a lower voltage from a higher one',
    components: ['R1', 'R2'],
    connections: ['VIN -> R1 -> VOUT -> R2 -> GND'],
    applications: ['Voltage sensing', 'Level shifting', 'Biasing'],
  },
  {
    name: '5V Linear Regulator',
    description: 'Classic 7805 or AMS1117-5.0 voltage regulator circuit',
    components: ['Regulator (7805)', 'C1 (100nF input)', 'C2 (10µF output)'],
    connections: ['VIN -> C1 -> Regulator VIN', 'Regulator VOUT -> C2 -> Load', 'GND common'],
    applications: ['Power supply', 'Arduino power', 'Sensor power'],
  },
  {
    name: 'N-Channel MOSFET Switch',
    description: 'Low-side switching using N-channel MOSFET',
    components: ['MOSFET (2N7000)', 'Gate Resistor (10kΩ)', 'Pull-down Resistor (10kΩ)'],
    connections: ['Control -> Gate Resistor -> Gate', 'Gate -> Pull-down -> GND', 'Load -> Drain', 'Source -> GND'],
    applications: ['Motor control', 'LED switching', 'Relay drivers'],
  },
  {
    name: 'ESP32 Basic Circuit',
    description: 'Minimal ESP32 circuit with power and programming',
    components: ['ESP32', 'Capacitors (10µF, 100nF)', '3.3V Regulator', 'Programming Header'],
    connections: ['3.3V -> ESP32 VCC', 'Decoupling caps near power pins', 'EN pulled high', 'IO0 for programming'],
    applications: ['IoT devices', 'WiFi projects', 'Sensor nodes'],
  },
];

/**
 * Search knowledge base for relevant information
 */
export function searchKnowledge(query: string): {
  components: ComponentInfo[];
  patterns: CircuitPattern[];
} {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/);

  const matchingComponents = componentKnowledge.filter(comp => {
    const searchText = [
      comp.type,
      comp.description,
      ...comp.applications,
      ...comp.keywords,
    ].join(' ').toLowerCase();

    return queryWords.some(word => searchText.includes(word));
  });

  const matchingPatterns = circuitPatterns.filter(pattern => {
    const searchText = [
      pattern.name,
      pattern.description,
      ...pattern.applications,
      ...pattern.components,
    ].join(' ').toLowerCase();

    return queryWords.some(word => searchText.includes(word));
  });

  return {
    components: matchingComponents,
    patterns: matchingPatterns,
  };
}

/**
 * Get component by type
 */
export function getComponentInfo(type: string): ComponentInfo | undefined {
  return componentKnowledge.find(c => c.type.toLowerCase() === type.toLowerCase());
}

/**
 * Format knowledge for LLM context
 */
export function formatKnowledgeContext(
  components: ComponentInfo[],
  patterns: CircuitPattern[]
): string {
  const parts: string[] = [];

  if (components.length > 0) {
    parts.push('Relevant Components:');
    for (const comp of components) {
      parts.push(`- ${comp.type}: ${comp.description}`);
      parts.push(`  Common values: ${comp.commonValues.join(', ')}`);
      parts.push(`  Applications: ${comp.applications.join(', ')}`);
    }
  }

  if (patterns.length > 0) {
    parts.push('\nRelevant Circuit Patterns:');
    for (const pattern of patterns) {
      parts.push(`- ${pattern.name}: ${pattern.description}`);
      parts.push(`  Components: ${pattern.components.join(', ')}`);
    }
  }

  return parts.join('\n');
}
