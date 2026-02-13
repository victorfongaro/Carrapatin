// Configuração
export { 
  app, 
  db, 
  auth, 
  storage, 
  testFirebaseConnection, 
  inicializarFazenda 
} from './config';

// Serviços existentes
export * from './services';

// Serviço de vacas
export * from './vacasService';

// NOVO: Exportar função de criar vacas
export { criarVacasTeste } from './services';