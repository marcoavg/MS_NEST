import { Inject, Injectable } from '@nestjs/common';
import { envs, NATS_SERVICE } from 'src/config';
import Stripe from 'stripe';
import { PaymentSessionDto } from './dto/payment-session.dto';
import { Request, Response } from 'express';
import { ClientProxy } from '@nestjs/microservices/client/client-proxy';

@Injectable()
export class PaymentsService {
    
    private readonly stripeSecret = new Stripe(envs.stripeSecret);

    constructor(
        @Inject(NATS_SERVICE) private readonly client: ClientProxy
    ) {}

    async createPaymentSession(paymentSessionDto: PaymentSessionDto ) {

        const { currency, items, orderId } = paymentSessionDto;
        const lineItems = items.map(item => ({
            price_data: {
                currency,
                product_data: {
                    name: item.name,
                },
                unit_amount: Math.round(item.price * 100), // Convertir a centavos
            },
            quantity: item.quantity,
        }));
    
        const session = await this.stripeSecret.checkout.sessions.create({
            // Colocar ID de mi orden
            payment_intent_data: {
                metadata:{
                    orderId: orderId
                }
            },
            line_items: lineItems,
            mode: 'payment',
            success_url: envs.stripeSuccessUrl,
            cancel_url: envs.stripeCancelUrl,
        });

        return session;
    }

    async stripeWebhook(req: Request, res: Response) {
        const sig = req.headers['stripe-signature'];
        let event: Stripe.Event;
        
        // test
        //const endpointSecret = "whsec_t4cFlR7n3QkpNS5Is1ofnwBJIpGoTzmO";
        // console.log(sig);
        try {
            
            event = this.stripeSecret.webhooks.constructEvent(req['rawBody'], sig!!, envs.stripeSecretWebhook);
            // Manejar el evento de Stripe
            // console.log('Evento de Stripe recibido:', event);
            // res.status(200).send({ received: true });
            //console.log(sig)
        } catch (error) {
            console.error('Error al manejar el webhook de Stripe:', error);
            res.status(400).send({ error: `Webhook error: ${error.message}` });
        }
        switch (event!!.type) {
            case 'charge.succeeded':{
                const charge = event!!.data.object as Stripe.Charge;
                const payload = {
                    stripePaymentId: charge.id,
                    orderId: charge.metadata.orderId,
                    receiptUrl: charge.receipt_url
                }
                this.client.emit('payment.succeeded', payload);
                break;
            }

            default:
                console.log(`Unhandled event type ${event!!.type}`);
                
        }
        console.log('Webhook processed successfully');
        return res.status(200).json({ sig });
    }

}
