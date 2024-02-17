<script lang="ts">
  import * as Form from "$cui/form";
  import { Button } from "$cui/button";
  import { Alert } from "$lib";
  import { sign_up, type sign_upSchema } from "$src/schema";
  import type { FormOptions } from "formsnap";
  import type { SuperValidated } from "sveltekit-superforms";
  import { goto } from "$app/navigation";
  const options: FormOptions<typeof sign_up> = {
    validators: sign_up,
    onSubmit: () => {
      console.log("SUBMIT");
      submitting = true;
    },
    onResult(event) {
      if (event.result.type == "failure") {
        success = false;
      } else {
        success = true;
      }
      if (!success) {
        setTimeout(() => location.reload(), 1000);
      } else {
        setTimeout(() => goto("sign-in"), 1000);
      }
    },
    warnings: {
      noValidationAndConstraints: false,
    },
  };

  let submitting: boolean = false;
  let success: boolean | null = null;
  export let form: SuperValidated<sign_upSchema>;
</script>

<Alert submitting={submitting} success={success}/>
<div class="flex justify-center">
  <div class="w-4/5 max-w-lg">
    <Form.Root {options} method="POST" {form} schema={sign_up} let:config>
      <Form.Field {config} name="username">
        <Form.Item>
          <Form.Label>Username</Form.Label>
          <Form.Input />
          <Form.Description>This is your public display name.</Form.Description>
          <Form.Validation />
        </Form.Item>
      </Form.Field>
      <Form.Field {config} name="email">
        <Form.Item>
          <Form.Label>E-Mail</Form.Label>
          <Form.Input />
          <Form.Validation />
        </Form.Item>
      </Form.Field>
      <Form.Field {config} name="password">
        <Form.Item>
          <Form.Label>Password</Form.Label>
          <Form.Input />
          <Form.Validation />
        </Form.Item>
      </Form.Field>
      <Form.Button>Sign Up</Form.Button>
    </Form.Root>
  </div>
</div>
