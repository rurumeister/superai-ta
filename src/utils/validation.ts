import Joi from "joi";

export const checkoutSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required(),
  email: Joi.string().email().required(),
});

export const webhookSchema = Joi.object({
  id: Joi.string().required(),
  type: Joi.string()
    .valid("charge:created", "charge:confirmed", "charge:failed")
    .required(),
  created_at: Joi.string().isoDate().required(),
  data: Joi.object({
    id: Joi.string().required(),
    code: Joi.string().required(),
    name: Joi.string().required(),
    description: Joi.string().allow(""),
    pricing: Joi.object({
      local: Joi.object({
        amount: Joi.string().required(),
        currency: Joi.string().required(),
      }),
      bitcoin: Joi.object({
        amount: Joi.string().required(),
        currency: Joi.string().required(),
      }),
    }),
    metadata: Joi.object({
      email: Joi.string().email().required(),
      checkout_id: Joi.string().required(),
    }),
    timeline: Joi.array().items(
      Joi.object({
        time: Joi.string().isoDate().required(),
        status: Joi.string().required(),
      })
    ),
  }).required(),
});
