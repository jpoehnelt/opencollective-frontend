import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import StyledInputFormikField from '../../StyledInputFormikField';
import { InputGroup } from '../../ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/Tabs';
import { Textarea } from '../../ui/Textarea';
import { type ExpenseForm, InviteeAccountType } from '../useExpenseForm';

type InviteUserOptionProps = {
  form: ExpenseForm;
};

export function InviteUserOption(props: InviteUserOptionProps) {
  const { setFieldValue } = props.form;
  return (
    <div>
      <div>
        <div className="">
          <Tabs
            id="lastSubmittedAccount"
            value={props.form.values.inviteeAccountType}
            onValueChange={newValue => setFieldValue('inviteeAccountType', newValue as InviteeAccountType)}
          >
            <TabsList>
              <TabsTrigger
                value={InviteeAccountType.INDIVIDUAL}
                className="data-[state=active]:text-blue-900 data-[state=active]:shadow"
              >
                <FormattedMessage defaultMessage="Personal Account" id="Sch2bu" />
              </TabsTrigger>
              <TabsTrigger
                value={InviteeAccountType.ORGANIZATION}
                className="data-[state=active]:text-blue-900 data-[state=active]:shadow"
              >
                <FormattedMessage defaultMessage="Organization Account" id="cS9oSV" />
              </TabsTrigger>
            </TabsList>
            <TabsContent value={InviteeAccountType.INDIVIDUAL}>
              <NewIndividualInviteeForm />
            </TabsContent>
            <TabsContent value={InviteeAccountType.ORGANIZATION}>
              <NewOrganizationInviteeForm />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function NewIndividualInviteeForm() {
  const intl = useIntl();
  return (
    <fieldset className="flex flex-col gap-4">
      <StyledInputFormikField
        isFastField
        label={intl.formatMessage({ defaultMessage: 'Contact name', id: 'ContactName' })}
        name="inviteeNewIndividual.name"
      />

      <StyledInputFormikField
        isFastField
        label={intl.formatMessage({ defaultMessage: 'Email address', id: 'User.EmailAddress' })}
        name="inviteeNewIndividual.email"
      />

      <StyledInputFormikField
        isFastField
        label={intl.formatMessage({ defaultMessage: 'Notes for the recipient (optional)', id: 'd+MntU' })}
        name="inviteeNewIndividual.notes"
      >
        {({ field }) => <Textarea className="w-full" {...field} />}
      </StyledInputFormikField>
    </fieldset>
  );
}

function NewOrganizationInviteeForm() {
  const intl = useIntl();
  return (
    <fieldset className="flex flex-col gap-4">
      <StyledInputFormikField
        isFastField
        label={intl.formatMessage({ defaultMessage: 'Name of the organization', id: 'KZfQ/g' })}
        name="inviteeNewOrganization.organization.name"
      />

      <StyledInputFormikField
        isFastField
        label={intl.formatMessage({ defaultMessage: 'Set profile URL', id: 'ieO6cP' })}
        name="inviteeNewOrganization.organization.slug"
      >
        {({ field }) => (
          <InputGroup className="w-full" prepend="opencollectice.com/" id="organizationSlug" type="text" {...field} />
        )}
      </StyledInputFormikField>

      <StyledInputFormikField
        isFastField
        label={intl.formatMessage({ defaultMessage: 'Organization Website', id: 'uN6AOo' })}
        name="inviteeNewOrganization.organization.website"
      >
        {({ field }) => <InputGroup className="w-full" prepend="https://" type="text" {...field} />}
      </StyledInputFormikField>

      <StyledInputFormikField
        isFastField
        label={intl.formatMessage({ defaultMessage: 'Organization Description', id: 'rClz3r' })}
        name="inviteeNewOrganization.organization.description"
      />
      <StyledInputFormikField
        isFastField
        label={intl.formatMessage({ defaultMessage: 'Contact name', id: 'ContactName' })}
        name="inviteeNewOrganization.name"
      />

      <StyledInputFormikField
        isFastField
        label={intl.formatMessage({ defaultMessage: 'Email Address', id: 'xxQxLE' })}
        name="inviteeNewOrganization.email"
      />

      <StyledInputFormikField
        isFastField
        label={intl.formatMessage({ defaultMessage: 'Notes for the recipient (optional)', id: 'd+MntU' })}
        name="inviteeNewOrganization.notes"
      >
        {({ field }) => <Textarea className="w-full" {...field} />}
      </StyledInputFormikField>
    </fieldset>
  );
}
