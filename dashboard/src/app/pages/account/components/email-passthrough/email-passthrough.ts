import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { PageTitleComponent } from '@shared-components/page-title/page-title.component';
import { MatInputModule } from '@angular/material/input';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { AccountFormGroupBuilder } from '@account/models/form-groups/account-form-group-builder';

@Component({
  selector: 'app-email-passthrough',
  imports: [
    MatButton,
    MatIconModule,
    PageTitleComponent,
    MatInputModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  templateUrl: './email-passthrough.html',
  styleUrl: './email-passthrough.scss',
})
export class EmailPassthrough {
  private formBuilder = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  protected accountFormGroupBuilder: AccountFormGroupBuilder;
  protected emailFormGroup: FormGroup;

  constructor() {
    this.accountFormGroupBuilder = new AccountFormGroupBuilder(
      this.formBuilder
    );
    this.emailFormGroup = this.accountFormGroupBuilder.buildEmailForm();
  }

  title() {
    return (
      this.route.snapshot.queryParamMap.get('title') ??
      "You probably shouldn' be here and the button will do nothing"
    );
  }

  passthroughLink() {
    // TODO: Validate this this is a valid URL
    if (this.emailFormGroup.valid) {
      return this.route.snapshot.queryParamMap.get('passthroughLink') ?? '/';
    } else return '/';
  }
}
