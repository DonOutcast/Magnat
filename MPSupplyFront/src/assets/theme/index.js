/**
=========================================================
* Soft UI Dashboard PRO React - v4.0.1
=========================================================

* Product Page: https://www.creative-tim.com/product/soft-ui-dashboard-pro-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

// @mui material components
import { createTheme } from "@mui/material/styles";
// import Fade from "@mui/material/Fade";

// Soft UI Dashboard PRO React base styles
import colors from "./base/colors";
import breakpoints from "./base/breakpoints";
import typography from "./base/typography";
import boxShadows from "./base/boxShadows";
import borders from "./base/borders";
import globals from "./base/globals";

// Soft UI Dashboard PRO React helper functions
import boxShadow from "./functions/boxShadow";
import hexToRgb from "./functions/hexToRgb";
import linearGradient from "./functions/linearGradient";
import pxToRem from "./functions/pxToRem";
import rgba from "./functions/rgba";

// Soft UI Dashboard PRO React components base styles for @mui material components
import sidenav from "./components/sidenav";
import list from "./components/list";
import listItem from "./components/list/listItem";
import listItemText from "./components/list/listItemText";
import card from "./components/card";
import cardMedia from "./components/card/cardMedia";
import cardContent from "./components/card/cardContent";
import button from "./components/button";
import iconButton from "./components/iconButton";
import inputBase from "./components/form/inputBase";
import menu from "./components/menu";
import menuItem from "./components/menu/menuItem";
import switchButton from "./components/form/switchButton";
import divider from "./components/divider";
import tableContainer from "./components/table/tableContainer";
import tableHead from "./components/table/tableHead";
import tableCell from "./components/table/tableCell";
import linearProgress from "./components/linearProgress";
import breadcrumbs from "./components/breadcrumbs";
import slider from "./components/slider";
import avatar from "./components/avatar";
import tooltip from "./components/tooltip";
import appBar from "./components/appBar";
import tabs from "./components/tabs";
import tab from "./components/tabs/tab";
import stepper from "./components/stepper";
import step from "./components/stepper/step";
import stepConnector from "./components/stepper/stepConnector";
import stepLabel from "./components/stepper/stepLabel";
import stepIcon from "./components/stepper/stepIcon";
import select from "./components/form/select";
import formControlLabel from "./components/form/formControlLabel";
import formLabel from "./components/form/formLabel";
import checkbox from "./components/form/checkbox";
import radio from "./components/form/radio";
import autocomplete from "./components/form/autocomplete";
import input from "./components/form/input";
import flatpickr from "./components/flatpickr";
import swal from "./components/swal";
import container from "./components/container";
import popover from "./components/popover";
import buttonBase from "./components/buttonBase";
import icon from "./components/icon";
import svgIcon from "./components/svgIcon";
import link from "./components/link";
import dialog from "./components/dialog";
import dialogTitle from "./components/dialog/dialogTitle";
import dialogContent from "./components/dialog/dialogContent";
import dialogContentText from "./components/dialog/dialogContentText";
import dialogActions from "./components/dialog/dialogActions";

export default createTheme({
  breakpoints: { ...breakpoints },
  palette: { ...colors },
  typography: { ...typography },
  boxShadows: { ...boxShadows },
  borders: { ...borders },
  functions: {
    boxShadow,
    hexToRgb,
    linearGradient,
    pxToRem,
    rgba,
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ...globals,
        ...flatpickr,
        ...swal,
        ...container,
      },
    },
    MuiDrawer: { ...sidenav },
    MuiList: { ...list },
    MuiListItem: { ...listItem },
    MuiListItemText: { ...listItemText },
    MuiCard: { ...card },
    MuiCardMedia: { ...cardMedia },
    MuiCardContent: { ...cardContent },
    MuiButton: { ...button },
    MuiIconButton: { ...iconButton },
    MuiInputBase: { ...inputBase },
    MuiMenu: { ...menu },
    MuiMenuItem: { ...menuItem },
    MuiSwitch: { ...switchButton },
    MuiDivider: { ...divider },
    MuiTableContainer: { ...tableContainer },
    MuiTableHead: { ...tableHead },
    MuiTableCell: { ...tableCell },
    MuiLinearProgress: { ...linearProgress },
    MuiBreadcrumbs: { ...breadcrumbs },
    MuiSlider: { ...slider },
    MuiAvatar: { ...avatar },
    MuiTooltip: { ...tooltip },
    MuiAppBar: { ...appBar },
    MuiTabs: { ...tabs },
    MuiTab: { ...tab },
    MuiStepper: { ...stepper },
    MuiStep: { ...step },
    MuiStepConnector: { ...stepConnector },
    MuiStepLabel: { ...stepLabel },
    MuiStepIcon: { ...stepIcon },
    MuiSelect: { ...select },
    MuiFormControlLabel: { ...formControlLabel },
    MuiFormLabel: { ...formLabel },
    MuiCheckbox: { ...checkbox },
    MuiRadio: { ...radio },
    MuiAutocomplete: { ...autocomplete },
    MuiInput: { ...input },
    MuiOutlinedInput: { ...input },
    MuiFilledInput: { ...input },
    MuiPopover: { ...popover },
    MuiButtonBase: { ...buttonBase },
    MuiIcon: { ...icon },
    MuiSvgIcon: { ...svgIcon },
    MuiLink: { ...link },
    MuiDialog: { ...dialog },
    MuiDialogTitle: { ...dialogTitle },
    MuiDialogContent: { ...dialogContent },
    MuiDialogContentText: { ...dialogContentText },
    MuiDialogActions: { ...dialogActions },
  },
});
