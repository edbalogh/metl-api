import {NgModule} from "@angular/core";
import {BrowserModule} from "@angular/platform-browser";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {
  MatCardModule,
  MatGridListModule,
  MatInputModule,
  MatListModule,
  MatRadioModule,
  MatSlideToggleModule,
  MatTabsModule,
  MatToolbarModule,
  MatTooltipModule,
  MatTreeModule
} from "@angular/material";
import {HttpClientModule} from "@angular/common/http";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatExpansionModule} from "@angular/material/expansion";
import {MatSelectModule} from "@angular/material/select";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {MatMenuModule} from "@angular/material/menu";
import {ErrorModalModule} from "../error-modal/error.modal.module";
import {ConfirmationModalModule} from "../confirmation/confirmation.modal.module";
import {PropertiesEditorModule} from "../properties-editor/properties.editor.module";
import {MatDialogModule} from "@angular/material/dialog";

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    ConfirmationModalModule,
    ErrorModalModule,
    PropertiesEditorModule,
    MatCardModule,
    MatDialogModule,
    MatGridListModule,
    MatToolbarModule,
    HttpClientModule,
    MatInputModule,
    MatRadioModule,
    MatSlideToggleModule,
    MatTabsModule,
    MatTreeModule,
    MatListModule,
    MatTooltipModule,
    MatExpansionModule,
    MatMenuModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    BrowserModule,
    BrowserAnimationsModule,
    ConfirmationModalModule,
    ErrorModalModule,
    PropertiesEditorModule,
    MatCardModule,
    MatDialogModule,
    MatGridListModule,
    MatToolbarModule,
    HttpClientModule,
    MatInputModule,
    MatRadioModule,
    MatSlideToggleModule,
    MatTabsModule,
    MatTreeModule,
    MatListModule,
    MatTooltipModule,
    MatExpansionModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    FormsModule,
    ReactiveFormsModule
  ]
})

export class SharedComponentsModule {}
