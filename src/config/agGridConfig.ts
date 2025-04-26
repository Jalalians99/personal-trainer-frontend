import { ModuleRegistry } from "@ag-grid-community/core";
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";

// Register all required AG Grid modules
ModuleRegistry.registerModules([ClientSideRowModelModule]);

// Export default column definitions that can be reused across grids
export const defaultColDef = {
  sortable: true,
  filter: true,
  resizable: true,
  flex: 1,
  minWidth: 100,
};

// Export common grid styles
export const gridStyles = {
  height: 600,
  width: "100%",
};
